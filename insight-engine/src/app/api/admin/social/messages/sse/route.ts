import { NextRequest } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query } from '@/lib/db'
import { decryptApiKey } from '@/lib/aiCrypto'
import { getIsTyping } from '@/lib/dmEventStore'

interface MsgRow extends Record<string, unknown> {
  id: string
  from_user_id: string
  to_user_id: string
  encrypted_content: string
  iv: string
  tag: string
  read_at: string | null
  recalled_at: string | null
  created_at: string
  from_name: string | null
  from_avatar: string | null
}

interface ReadRow extends Record<string, unknown> {
  id: string
  read_at: string
}

export async function GET(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const withUserId = searchParams.get('userId')
  if (!withUserId) return new Response('userId required', { status: 400 })

  const encoder = new TextEncoder()

  // Track last seen timestamps for deduplication
  let lastCreatedAt = searchParams.get('since') ?? new Date(Date.now() - 5000).toISOString()
  let lastReadCheck = new Date(Date.now() - 5000).toISOString()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const poll = async () => {
        try {
          // 1. New messages
          const msgRows = await query<MsgRow>(
            `SELECT dm.*,
               au.display_name as from_name,
               au.avatar_url as from_avatar
             FROM direct_messages dm
             JOIN admin_users au ON au.id = dm.from_user_id
             WHERE (
               (dm.from_user_id = $1 AND dm.to_user_id = $2) OR
               (dm.from_user_id = $2 AND dm.to_user_id = $1)
             )
             AND dm.created_at > $3
             ORDER BY dm.created_at ASC
             LIMIT 50`,
            [ctx.userId, withUserId, lastCreatedAt]
          )

          const newMessages = msgRows.map(r => {
            let content = '[解密失敗]'
            if (r.recalled_at) {
              content = '[已收回]'
            } else {
              try { content = decryptApiKey({ encrypted: r.encrypted_content, iv: r.iv, tag: r.tag }) } catch { /* fallback */ }
            }
            return {
              id: r.id,
              fromUserId: r.from_user_id,
              toUserId: r.to_user_id,
              content,
              fromName: r.from_name,
              fromAvatar: r.from_avatar,
              readAt: r.read_at,
              createdAt: r.created_at,
            }
          })

          if (msgRows.length > 0) {
            lastCreatedAt = msgRows[msgRows.length - 1].created_at
          }

          // 2. Read receipts: my messages that were just read by the other person
          const readRows = await query<ReadRow>(
            `SELECT id, read_at::text AS read_at
             FROM direct_messages
             WHERE from_user_id = $1 AND to_user_id = $2
               AND read_at IS NOT NULL AND read_at > $3`,
            [ctx.userId, withUserId, lastReadCheck]
          )
          if (readRows.length > 0) {
            lastReadCheck = readRows[readRows.length - 1].read_at
          }

          // 3. Typing indicator (other person typing to me)
          const isTyping = getIsTyping(withUserId, ctx.userId)

          // Always send so client gets typing/read updates even with no new messages
          // Theme sync proposals now come via messages (persisted in direct_messages table)
          send({
            type: newMessages.length > 0 ? 'messages' : 'ping',
            messages: newMessages.length > 0 ? newMessages : undefined,
            isTyping,
            readUpdates: readRows.length > 0
              ? readRows.map(r => ({ id: r.id, readAt: r.read_at }))
              : undefined,
          })
        } catch {
          send({ type: 'ping' })
        }
      }

      await poll()
      const interval = setInterval(poll, 3000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

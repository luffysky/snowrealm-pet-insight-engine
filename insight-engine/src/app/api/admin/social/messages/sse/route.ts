import { NextRequest } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query } from '@/lib/db'
import { decryptApiKey } from '@/lib/aiCrypto'

interface MsgRow extends Record<string, unknown> {
  id: string
  from_user_id: string
  to_user_id: string
  encrypted_content: string
  iv: string
  tag: string
  read_at: string | null
  created_at: string
  from_name: string | null
  from_avatar: string | null
}

export async function GET(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const withUserId = searchParams.get('userId')
  if (!withUserId) return new Response('userId required', { status: 400 })

  const encoder = new TextEncoder()
  // Use created_at for tracking instead of id (UUIDs are random, not sortable by time)
  let lastCreatedAt = searchParams.get('since') ?? new Date(Date.now() - 5000).toISOString()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send heartbeat + poll for new messages
      const poll = async () => {
        try {
          const rows = await query<MsgRow>(
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

          if (rows.length > 0) {
            const messages = rows.map(r => {
              let content = ''
              try { content = decryptApiKey({ encrypted: r.encrypted_content, iv: r.iv, tag: r.tag }) } catch { content = '[解密失敗]' }
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
            lastCreatedAt = rows[rows.length - 1].created_at
            send({ type: 'messages', messages })
          } else {
            send({ type: 'ping' })
          }
        } catch {
          send({ type: 'ping' })
        }
      }

      await poll()
      const interval = setInterval(poll, 3000) // Poll every 3 seconds

      // Clean up when client disconnects
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

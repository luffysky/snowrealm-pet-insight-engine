import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, execute } from '@/lib/db'
import { decryptApiKey } from '@/lib/aiCrypto'

interface MessageRow extends Record<string, unknown> {
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

interface MessageResult {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  readAt: string | null
  createdAt: string
  fromName: string | null
  fromAvatar: string | null
  isMine: boolean
}

/** GET /api/admin/social/messages/[userId] — 取得與特定用戶的對話 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const { userId: otherId } = await params

  const rows = await query<MessageRow>(
    `SELECT dm.id, dm.from_user_id, dm.to_user_id,
            dm.encrypted_content, dm.iv, dm.tag,
            dm.read_at, dm.created_at,
            u.display_name AS from_name, u.avatar_url AS from_avatar
     FROM direct_messages dm
     JOIN admin_users u ON u.id = dm.from_user_id
     WHERE (dm.from_user_id = $1 AND dm.to_user_id = $2)
        OR (dm.from_user_id = $2 AND dm.to_user_id = $1)
     ORDER BY dm.created_at ASC
     LIMIT 100`,
    [myId, otherId]
  )

  // Mark unread as read
  await execute(
    `UPDATE direct_messages SET read_at = NOW()
     WHERE from_user_id = $1 AND to_user_id = $2 AND read_at IS NULL`,
    [otherId, myId]
  )

  const messages: MessageResult[] = rows.map(row => {
    let content = '[無法解密]'
    try {
      content = decryptApiKey({ encrypted: row.encrypted_content, iv: row.iv, tag: row.tag })
    } catch {
      // keep fallback
    }
    return {
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      content,
      readAt: row.read_at,
      createdAt: row.created_at,
      fromName: row.from_name,
      fromAvatar: row.from_avatar,
      isMine: row.from_user_id === myId,
    }
  })

  return NextResponse.json({ messages })
}

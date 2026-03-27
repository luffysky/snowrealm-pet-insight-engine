import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, execute } from '@/lib/db'
import { encryptApiKey, decryptApiKey } from '@/lib/aiCrypto'

interface ConversationRow extends Record<string, unknown> {
  other_user_id: string
  other_name: string | null
  other_avatar: string | null
  encrypted_content: string
  iv: string
  tag: string
  created_at: string
  unread_count: string
}

interface ConversationResult {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

/** GET /api/admin/social/messages — 列出所有對話 */
export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const rows = await query<ConversationRow>(
    `SELECT DISTINCT ON (other_user_id)
      CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END::text AS other_user_id,
      u.display_name AS other_name,
      u.avatar_url AS other_avatar,
      dm.encrypted_content,
      dm.iv,
      dm.tag,
      dm.created_at,
      (SELECT COUNT(*) FROM direct_messages dm2
        WHERE dm2.to_user_id = $1
          AND dm2.from_user_id = CASE WHEN dm.from_user_id = $1 THEN dm.to_user_id ELSE dm.from_user_id END
          AND dm2.read_at IS NULL)::text AS unread_count
    FROM direct_messages dm
    JOIN admin_users u ON u.id = CASE WHEN dm.from_user_id = $1 THEN dm.to_user_id ELSE dm.from_user_id END
    WHERE dm.from_user_id = $1 OR dm.to_user_id = $1
    ORDER BY other_user_id, dm.created_at DESC`,
    [userId]
  )

  const conversations: ConversationResult[] = rows.map(row => {
    let preview = '...'
    try {
      preview = decryptApiKey({ encrypted: row.encrypted_content, iv: row.iv, tag: row.tag })
      if (preview.length > 60) preview = preview.slice(0, 60) + '...'
    } catch {
      preview = '[無法解密]'
    }
    return {
      userId: row.other_user_id,
      displayName: row.other_name,
      avatarUrl: row.other_avatar,
      lastMessagePreview: preview,
      lastMessageAt: row.created_at,
      unreadCount: parseInt(row.unread_count ?? '0', 10),
    }
  })

  return NextResponse.json({ conversations })
}

/** POST /api/admin/social/messages — 傳送私訊 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const body = await req.json() as { toUserId?: string; content?: string }
  const { toUserId, content } = body

  if (!toUserId || !content?.trim()) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }
  if (toUserId === userId) {
    return NextResponse.json({ error: '不能傳訊息給自己' }, { status: 400 })
  }

  try {
    const { encrypted, iv, tag } = encryptApiKey(content.trim())
    await execute(
      `INSERT INTO direct_messages (from_user_id, to_user_id, encrypted_content, iv, tag)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, toUserId, encrypted, iv, tag]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '發送失敗' }, { status: 500 })
  }
}

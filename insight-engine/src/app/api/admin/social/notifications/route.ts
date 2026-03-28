import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { query, execute } from '@/lib/db'

interface NotifRow extends Record<string, unknown> {
  id: string
  type: string
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  target_id: string | null
  target_title: string | null
  created_at: string
  read_at: string | null
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string }
}

/** GET /api/admin/social/notifications — 取得通知列表 */
export async function GET(): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ notifications: [] })

  const rows = await query<NotifRow>(
    `SELECT n.id, n.type, n.actor_id, n.target_id, n.target_title, n.created_at, n.read_at,
            u.display_name AS actor_name, u.avatar_url AS actor_avatar
     FROM social_notifications n
     JOIN admin_users u ON u.id::text = n.actor_id::text
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [auth.userId]
  )

  const notifications = rows.map(r => ({
    id: r.id,
    type: r.type,
    actorId: r.actor_id,
    actorName: r.actor_name,
    actorAvatar: r.actor_avatar,
    targetId: r.target_id,
    targetTitle: r.target_title,
    createdAt: r.created_at,
    readAt: r.read_at,
  }))

  return NextResponse.json({ notifications })
}

/** PATCH /api/admin/social/notifications — 標記已讀
 *  body: {} 或 { notificationId: string } — 不帶 ID 則標記全部 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  let body: { notificationId?: string } = {}
  try { body = await req.json() as { notificationId?: string } } catch { /* no body */ }

  if (body.notificationId) {
    await execute(
      `UPDATE social_notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [body.notificationId, auth.userId]
    )
  } else {
    await execute(
      `UPDATE social_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [auth.userId]
    )
  }

  return NextResponse.json({ ok: true })
}

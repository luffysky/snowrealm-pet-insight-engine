import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, execute, queryOne } from '@/lib/db'

interface FriendRequestRow extends Record<string, unknown> {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
  message: string | null
  created_at: string
  from_name: string | null
  from_avatar: string | null
  to_name: string | null
  to_avatar: string | null
}

/** GET — 取得好友請求列表 or 所有用戶（?type=incoming|outgoing|friends|users） */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const type = req.nextUrl.searchParams.get('type') ?? 'incoming'

  if (type === 'users') {
    // All users except self, with friend status
    const rows = await query<Record<string, unknown>>(
      `SELECT u.id, u.display_name, u.avatar_url,
              fr.status AS friend_status
       FROM admin_users u
       LEFT JOIN friend_requests fr ON (
         (fr.from_user_id = $1 AND fr.to_user_id = u.id::text)
         OR (fr.from_user_id = u.id::text AND fr.to_user_id = $1)
       )
       WHERE u.id::text <> $1
       ORDER BY u.display_name ASC`,
      [myId]
    )
    return NextResponse.json({ users: rows })
  }

  if (type === 'incoming') {
    const rows = await query<FriendRequestRow>(
      `SELECT fr.id, fr.from_user_id, fr.to_user_id, fr.status, fr.message, fr.created_at,
              u.display_name AS from_name, u.avatar_url AS from_avatar
       FROM friend_requests fr
       JOIN admin_users u ON u.id::text = fr.from_user_id
       WHERE fr.to_user_id = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [myId]
    )
    return NextResponse.json({ requests: rows })
  }

  if (type === 'outgoing') {
    const rows = await query<FriendRequestRow>(
      `SELECT fr.id, fr.from_user_id, fr.to_user_id, fr.status, fr.created_at,
              u.display_name AS to_name, u.avatar_url AS to_avatar
       FROM friend_requests fr
       JOIN admin_users u ON u.id::text = fr.to_user_id
       WHERE fr.from_user_id = $1
       ORDER BY fr.created_at DESC`,
      [myId]
    )
    return NextResponse.json({ requests: rows })
  }

  // type=friends — accepted mutual
  const rows = await query<FriendRequestRow>(
    `SELECT DISTINCT
       CASE WHEN fr.from_user_id = $1 THEN fr.to_user_id ELSE fr.from_user_id END AS friend_id,
       u.display_name AS friend_name, u.avatar_url AS friend_avatar
     FROM friend_requests fr
     JOIN admin_users u ON u.id::text = CASE WHEN fr.from_user_id = $1 THEN fr.to_user_id ELSE fr.from_user_id END
     WHERE (fr.from_user_id = $1 OR fr.to_user_id = $1) AND fr.status = 'accepted'`,
    [myId]
  )
  return NextResponse.json({ friends: rows })
}

/** POST — 發送好友請求 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const body = await req.json() as { toUserId: string; message?: string }
  if (!body.toUserId) return NextResponse.json({ error: '缺少 toUserId' }, { status: 400 })
  if (body.toUserId === myId) return NextResponse.json({ error: '不能加自己' }, { status: 400 })

  // Check if already exists
  const existing = await queryOne<{ status: string }>(
    `SELECT status FROM friend_requests
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [myId, body.toUserId]
  )
  if (existing) {
    if (existing.status === 'accepted') return NextResponse.json({ error: '已是好友' }, { status: 409 })
    if (existing.status === 'pending') return NextResponse.json({ error: '請求已存在' }, { status: 409 })
  }

  await execute(
    `INSERT INTO friend_requests (from_user_id, to_user_id, message)
     VALUES ($1, $2, $3)
     ON CONFLICT (from_user_id, to_user_id)
     DO UPDATE SET status = 'pending', updated_at = NOW()`,
    [myId, body.toUserId, body.message ?? null]
  )

  return NextResponse.json({ ok: true })
}

/** PATCH — 接受 / 拒絕好友請求 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const body = await req.json() as { requestId: string; action: 'accept' | 'decline' }
  if (!body.requestId || !body.action) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

  const newStatus = body.action === 'accept' ? 'accepted' : 'declined'

  const rowCount = await execute(
    `UPDATE friend_requests SET status = $1, updated_at = NOW()
     WHERE id = $2 AND to_user_id = $3`,
    [newStatus, body.requestId, myId]
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: '請求不存在或無權限' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE — 刪除好友 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const body = await req.json() as { friendUserId: string }
  if (!body.friendUserId) return NextResponse.json({ error: '缺少 friendUserId' }, { status: 400 })

  await execute(
    `DELETE FROM friend_requests
     WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
       AND status = 'accepted'`,
    [myId, body.friendUserId]
  )

  return NextResponse.json({ ok: true })
}

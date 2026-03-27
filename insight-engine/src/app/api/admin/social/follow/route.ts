import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getTenantContext } from '@/lib/tenant'
import { query, queryOne, execute } from '@/lib/db'

async function pushFollowNotification(userId: string, actorId: string) {
  if (userId === actorId) return
  await execute(
    `INSERT INTO social_notifications (user_id, actor_id, type) VALUES ($1, $2, 'follow')`,
    [userId, actorId]
  ).catch(() => {})
}

interface FollowRow extends Record<string, unknown> {
  follower_id: string
  following_id: string
}

interface CountRow extends Record<string, unknown> {
  followers: string
  following: string
}

interface UserRow extends Record<string, unknown> {
  id: string
  display_name: string | null
  avatar_url: string | null
}

/** GET /api/admin/social/follow?userId=xxx — 取得追蹤統計
 *  GET /api/admin/social/follow?userId=xxx&list=followers — 粉絲列表
 *  GET /api/admin/social/follow?userId=xxx&list=following — 追蹤中列表
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('userId') ?? ctx.userId
  const list = searchParams.get('list')

  // 回傳粉絲列表
  if (list === 'followers') {
    const users = await query<UserRow>(
      `SELECT au.id, au.display_name, au.avatar_url
       FROM user_follows uf
       JOIN admin_users au ON au.id::text = uf.follower_id
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 100`,
      [targetUserId]
    )
    return NextResponse.json({ users })
  }

  // 回傳追蹤中列表
  if (list === 'following') {
    const users = await query<UserRow>(
      `SELECT au.id, au.display_name, au.avatar_url
       FROM user_follows uf
       JOIN admin_users au ON au.id::text = uf.following_id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 100`,
      [targetUserId]
    )
    return NextResponse.json({ users })
  }

  // 預設：回傳統計數字
  const counts = await queryOne<CountRow>(
    `SELECT
      (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) AS followers,
      (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) AS following`,
    [targetUserId]
  )

  let isFollowing = false
  if (ctx.userId && ctx.userId !== targetUserId) {
    const row = await queryOne<FollowRow>(
      `SELECT follower_id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [ctx.userId, targetUserId]
    )
    isFollowing = !!row
  }

  return NextResponse.json({
    followers: parseInt(counts?.followers ?? '0', 10),
    following: parseInt(counts?.following ?? '0', 10),
    isFollowing,
  })
}

/** POST /api/admin/social/follow — 追蹤 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as { targetUserId?: string }
  const { targetUserId } = body
  if (!targetUserId) return NextResponse.json({ error: '缺少 targetUserId' }, { status: 400 })
  if (targetUserId === roleCheck.userId) {
    return NextResponse.json({ error: '不能追蹤自己' }, { status: 400 })
  }

  try {
    await execute(
      `INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [roleCheck.userId, targetUserId]
    )
    await pushFollowNotification(targetUserId, roleCheck.userId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

/** DELETE /api/admin/social/follow — 取消追蹤 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as { targetUserId?: string }
  const { targetUserId } = body
  if (!targetUserId) return NextResponse.json({ error: '缺少 targetUserId' }, { status: 400 })

  try {
    await execute(
      `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [roleCheck.userId, targetUserId]
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

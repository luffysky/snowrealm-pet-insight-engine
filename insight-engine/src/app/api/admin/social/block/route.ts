import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { execute, queryOne, query } from '@/lib/db'

/** GET /api/admin/social/block?targetId=xxx — 查詢是否已封鎖 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const targetId = req.nextUrl.searchParams.get('targetId')
  if (!targetId) {
    // Return all blocked users
    const rows = await query<{ blocked_id: string; display_name: string | null; username: string; created_at: string } & Record<string, unknown>>(
      `SELECT ub.blocked_id, au.display_name, au.username, ub.created_at
       FROM user_blocks ub
       JOIN admin_users au ON au.id = ub.blocked_id
       WHERE ub.blocker_id = $1
       ORDER BY ub.created_at DESC`,
      [userId]
    )
    return NextResponse.json({ blocked: rows })
  }

  const exists = await queryOne<{ id: string }>(
    `SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
    [userId, targetId]
  )
  return NextResponse.json({ isBlocked: !!exists })
}

/** POST /api/admin/social/block — 封鎖用戶 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const body = await req.json() as { targetId?: string }
  if (!body.targetId) return NextResponse.json({ error: '缺少 targetId' }, { status: 400 })
  if (body.targetId === userId) return NextResponse.json({ error: '不能封鎖自己' }, { status: 400 })

  await execute(
    `INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, body.targetId]
  )
  return NextResponse.json({ ok: true })
}

/** DELETE /api/admin/social/block?targetId=xxx — 解除封鎖 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const targetId = req.nextUrl.searchParams.get('targetId')
  if (!targetId) return NextResponse.json({ error: '缺少 targetId' }, { status: 400 })

  await execute(
    `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
    [userId, targetId]
  )
  return NextResponse.json({ ok: true })
}

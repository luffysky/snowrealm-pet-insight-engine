import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { execute, queryOne } from '@/lib/db'

/** PATCH — 更新上線時間 + 可選更新 hide_online_status */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  let body: { hideOnlineStatus?: boolean } = {}
  try { body = await req.json() } catch { /* no body */ }

  if (body.hideOnlineStatus !== undefined) {
    await execute(
      `UPDATE admin_users SET last_active_at = NOW(), hide_online_status = $1 WHERE id = $2`,
      [body.hideOnlineStatus, userId]
    )
  } else {
    await execute(`UPDATE admin_users SET last_active_at = NOW() WHERE id = $1`, [userId])
  }

  return NextResponse.json({ ok: true })
}

/** GET — 取得目前用戶的 hide_online_status 設定 */
export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const row = await queryOne<{ hide_online_status: boolean }>(
    `SELECT hide_online_status FROM admin_users WHERE id = $1`, [userId]
  )

  return NextResponse.json({ hideOnlineStatus: row?.hide_online_status ?? false })
}

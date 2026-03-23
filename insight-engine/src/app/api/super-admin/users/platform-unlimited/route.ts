import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { verifySuperAdminRequest } from '@/lib/superAdminAuth'

export const dynamic = 'force-dynamic'

/**
 * PATCH 僅總管理員可呼叫：開關「單一帳號」平台合作夥伴（不影響其他使用者）
 * body: { userId: string, enabled: boolean }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdminRequest(request)
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  let body: { userId?: string; enabled?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 })
  }

  const { userId, enabled } = body
  if (!userId || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: '需要 userId 與 enabled（boolean）' }, { status: 400 })
  }

  const target = await queryOne<{ id: string }>(
    `SELECT id FROM admin_users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  )
  if (!target) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 })
  }

  if (enabled) {
    await execute(
      `UPDATE admin_users SET
         platform_unlimited = TRUE,
         platform_unlimited_at = NOW(),
         platform_unlimited_by = $2
       WHERE id = $1`,
      [userId, admin.sub]
    )
  } else {
    await execute(
      `UPDATE admin_users SET
         platform_unlimited = FALSE,
         platform_unlimited_at = NULL,
         platform_unlimited_by = NULL
       WHERE id = $1`,
      [userId]
    )
  }

  return NextResponse.json({ ok: true, userId, platformUnlimited: enabled })
}

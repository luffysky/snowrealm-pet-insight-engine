import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

async function requireSuperAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try {
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'super_admin') return null
    return payload
  } catch { return null }
}

/** POST /api/super-admin/ban — 封禁 / 解禁用戶 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as { userId?: string; action?: 'ban' | 'unban'; reason?: string }
  const { userId, action, reason } = body

  if (!userId || !action) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  // Cannot ban another super_admin
  const target = await queryOne<{ role: string; is_banned: boolean }>(`SELECT role, is_banned FROM admin_users WHERE id = $1`, [userId])
  if (!target) return NextResponse.json({ error: '用戶不存在' }, { status: 404 })
  if (target.role === 'super_admin') return NextResponse.json({ error: '無法封禁超級管理員' }, { status: 403 })

  if (action === 'ban') {
    await execute(
      `UPDATE admin_users SET is_banned = true, ban_reason = $1, banned_at = NOW(), banned_by = $2 WHERE id = $3`,
      [reason ?? '違反社群規範', auth.sub, userId]
    )
  } else {
    await execute(
      `UPDATE admin_users SET is_banned = false, ban_reason = NULL, banned_at = NULL, banned_by = NULL WHERE id = $1`,
      [userId]
    )
  }

  return NextResponse.json({ ok: true })
}

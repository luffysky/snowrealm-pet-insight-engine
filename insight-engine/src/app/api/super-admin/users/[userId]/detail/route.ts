import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const payload = await verifySuperAdmin(request)
  if (!payload) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { userId } = await params

  try {
    const user = await queryOne<{
      id: string; username: string; display_name: string | null
      email: string | null; phone: string | null; role: string
      created_at: string; auth_provider: string
      nickname: string | null; risk_score: number; on_watchlist: boolean
      banned_at: string | null; banned_reason: string | null
    }>(
      `SELECT au.id, au.username, au.display_name, au.email, au.phone, au.role,
              au.created_at, au.auth_provider,
              COALESCE(up.nickname, NULL) as nickname,
              COALESCE(up.risk_score, 0) as risk_score,
              COALESCE(up.on_watchlist, false) as on_watchlist,
              up.banned_at, up.banned_reason
       FROM admin_users au
       LEFT JOIN user_profiles up ON up.user_id = au.id
       WHERE au.id = $1`,
      [userId]
    )

    if (!user) return NextResponse.json({ error: '使用者不存在' }, { status: 404 })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

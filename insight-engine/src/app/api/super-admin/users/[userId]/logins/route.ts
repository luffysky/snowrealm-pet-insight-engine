import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { userId } = await params
  try {
    const logins = await query<{ id: string; ip_address: string | null; user_agent: string | null; created_at: string }>(
      `SELECT id, ip_address::text as ip_address, user_agent, created_at
       FROM activity_log
       WHERE user_id = $1 AND action = 'auth.login'
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    )
    return NextResponse.json({ logins })
  } catch {
    return NextResponse.json({ logins: [] })
  }
}

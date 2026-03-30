import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { userId } = await params
  const body = await request.json().catch(() => ({}))
  const reason = body.reason ?? '違規警告'

  try {
    await execute(
      `INSERT INTO activity_log (user_id, action, category, details) VALUES ($1, 'admin.warn_user', 'admin', $2)`,
      [payload.sub, JSON.stringify({ target_user_id: userId, reason })]
    ).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

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
    const surveys = await query<{ id: string; survey_title: string; status: string; submitted_at: string | null }>(
      `SELECT r.id, s.title as survey_title, r.status, r.submitted_at
       FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       JOIN admin_users au ON au.id = $1
       WHERE r.tenant_id = au.tenant_id
       ORDER BY r.submitted_at DESC NULLS LAST
       LIMIT 100`,
      [userId]
    )
    return NextResponse.json({ surveys })
  } catch {
    return NextResponse.json({ surveys: [] })
  }
}

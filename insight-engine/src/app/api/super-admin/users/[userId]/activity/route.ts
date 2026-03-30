import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { userId } = await params
  const url = new URL(request.url)
  const category = url.searchParams.get('category') ?? 'all'
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const offset = (page - 1) * 50

  try {
    const activities = await query<{
      id: string; action: string; category: string
      details: Record<string, unknown>; ip_address: string | null; created_at: string
    }>(
      `SELECT id, action, category, details, ip_address::text as ip_address, created_at
       FROM activity_log
       WHERE user_id = $1 AND ($2 = 'all' OR category = $2)
       ORDER BY created_at DESC
       LIMIT 50 OFFSET $3`,
      [userId, category, offset]
    )
    return NextResponse.json({ activities })
  } catch {
    return NextResponse.json({ activities: [] })
  }
}

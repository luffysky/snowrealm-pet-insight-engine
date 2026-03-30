import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const rows = await query<{ task: string; cost: string; calls: string }>(
      `SELECT COALESCE(intent_type, 'other') AS task,
              SUM(total_cost_usd)::TEXT AS cost,
              COUNT(*)::TEXT AS calls
       FROM ai_cost_log
       WHERE created_at >= date_trunc('month', NOW())
       GROUP BY intent_type
       ORDER BY cost DESC`
    )

    const data = rows.map(r => ({
      task: r.task,
      cost: parseFloat(r.cost),
      calls: parseInt(r.calls, 10),
    }))

    return NextResponse.json({ data })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [] })
    console.error('[ai-cost/by-task GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

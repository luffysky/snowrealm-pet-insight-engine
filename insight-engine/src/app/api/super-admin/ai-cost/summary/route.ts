import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

const MONTHLY_BUDGET = 150.0

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
    const row = await queryOne<{ month_total: string; total_calls: string }>(
      `SELECT
         COALESCE(SUM(total_cost_usd), 0)::TEXT AS month_total,
         COUNT(*)::TEXT AS total_calls
       FROM ai_cost_log
       WHERE created_at >= date_trunc('month', NOW())`
    )

    const monthTotal = parseFloat(row?.month_total ?? '0')
    const totalCalls = parseInt(row?.total_calls ?? '0', 10)
    const pct = MONTHLY_BUDGET > 0 ? Math.round((monthTotal / MONTHLY_BUDGET) * 100) : 0

    return NextResponse.json({ month_total: monthTotal, total_calls: totalCalls, budget: MONTHLY_BUDGET, pct })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ month_total: 0, total_calls: 0, budget: MONTHLY_BUDGET, pct: 0 })
    }
    console.error('[ai-cost/summary GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

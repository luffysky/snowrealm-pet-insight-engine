import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { userId }
}

const EMPTY = { today_total: 0, today_count: 0, yesterday_total: 0, change_pct: 0 }

export async function GET(): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const [today, yesterday] = await Promise.all([
      queryOne<{ today_total: string; today_count: string }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS today_total,
                COUNT(*)::text AS today_count
         FROM payment_orders
         WHERE status = 'completed'
           AND created_at >= CURRENT_DATE
           AND created_at < CURRENT_DATE + INTERVAL '1 day'`
      ),
      queryOne<{ yesterday_total: string }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS yesterday_total
         FROM payment_orders
         WHERE status = 'completed'
           AND created_at >= CURRENT_DATE - INTERVAL '1 day'
           AND created_at < CURRENT_DATE`
      ),
    ])

    const todayTotal = Number(today?.today_total ?? 0)
    const todayCount = Number(today?.today_count ?? 0)
    const yesterdayTotal = Number(yesterday?.yesterday_total ?? 0)
    const changePct = yesterdayTotal === 0
      ? (todayTotal > 0 ? 100 : 0)
      : Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)

    return NextResponse.json({
      today_total: todayTotal,
      today_count: todayCount,
      yesterday_total: yesterdayTotal,
      change_pct: changePct,
    })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json(EMPTY)
    throw err
  }
}

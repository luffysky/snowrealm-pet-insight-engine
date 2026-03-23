import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  try {
    const [
      dailyActiveTenants,
      dailyResponses,
      dailyAiUsage,
      userGrowth,
      topTenants,
    ] = await Promise.all([
      query<{ day: string; count: string }>(
        `SELECT DATE(r.submitted_at) AS day, COUNT(DISTINCT s.tenant_id) AS count
         FROM responses r
         JOIN surveys s ON r.survey_id = s.id
         WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY day ORDER BY day`
      ),
      query<{ day: string; count: string }>(
        `SELECT DATE(submitted_at) AS day, COUNT(*) AS count
         FROM responses
         WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY day ORDER BY day`
      ),
      query<{ day: string; count: string }>(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM ai_usage_logs
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY day ORDER BY day`
      ),
      query<{ day: string; count: string }>(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM admin_users
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY day ORDER BY day`
      ),
      query<{ tenant_id: string; name: string; count: string }>(
        `SELECT s.tenant_id, COALESCE(t.name, s.tenant_id) AS name, COUNT(*) AS count
         FROM responses r
         JOIN surveys s ON r.survey_id = s.id
         LEFT JOIN tenants t ON t.slug = s.tenant_id
         WHERE r.submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY s.tenant_id, t.name
         ORDER BY count DESC
         LIMIT 10`
      ),
    ])

    const formatRows = (rows: { day: string; count: string }[]) =>
      rows.map(r => ({ day: r.day, count: Number(r.count) }))

    return NextResponse.json({
      dailyActiveTenants: formatRows(dailyActiveTenants),
      dailyResponses: formatRows(dailyResponses),
      dailyAiUsage: formatRows(dailyAiUsage),
      userGrowth: formatRows(userGrowth),
      topTenants: topTenants.map(t => ({
        tenantId: t.tenant_id,
        name: t.name,
        count: Number(t.count),
      })),
    })
  } catch (e) {
    console.error('Analytics query failed:', e)
    return NextResponse.json({ error: '分析數據查詢失敗' }, { status: 500 })
  }
}

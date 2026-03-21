import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

interface DailyCount {
  [key: string]: unknown
  date: string
  count: string
}

interface TenantUsageRow {
  [key: string]: unknown
  slug: string
  name: string
  response_count: string
  survey_count: string
  ai_count: string
  notif_count: string
  last_response_at: string | null
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const [
    dailyResponses,
    dailyRegistrations,
    tenantUsage,
    totalDbSize,
  ] = await Promise.all([
    // 最近 30 天每日回覆數
    query<DailyCount>(
      `SELECT to_char(submitted_at, 'YYYY-MM-DD') AS date, COUNT(*)::text AS count
       FROM responses
       WHERE submitted_at >= NOW() - INTERVAL '30 days'
       GROUP BY 1
       ORDER BY 1`
    ),
    // 最近 30 天每日新註冊使用者
    query<DailyCount>(
      `SELECT to_char(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::text AS count
       FROM admin_users
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY 1
       ORDER BY 1`
    ),
    // 各租戶用量
    query<TenantUsageRow>(
      `SELECT t.slug, t.name,
              (SELECT COUNT(*) FROM responses r WHERE r.tenant_id = t.slug)::text AS response_count,
              (SELECT COUNT(*) FROM surveys s WHERE s.tenant_id = t.slug)::text AS survey_count,
              COALESCE((SELECT COUNT(*) FROM ai_usage_logs a WHERE a.tenant_id = t.slug)::text, '0') AS ai_count,
              COALESCE((SELECT COUNT(*) FROM notification_logs n WHERE n.tenant_id = t.slug)::text, '0') AS notif_count,
              (SELECT MAX(submitted_at) FROM responses r WHERE r.tenant_id = t.slug) AS last_response_at
       FROM tenants t
       ORDER BY response_count DESC`
    ),
    // 資料庫大小
    queryOne<{ size: string }>(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`
    ),
  ])

  return NextResponse.json({
    dailyResponses: (dailyResponses ?? []).map(d => ({
      date: d.date,
      count: Number(d.count),
    })),
    dailyRegistrations: (dailyRegistrations ?? []).map(d => ({
      date: d.date,
      count: Number(d.count),
    })),
    tenantUsage: (tenantUsage ?? []).map(t => ({
      slug: t.slug,
      name: t.name,
      responseCount: Number(t.response_count),
      surveyCount: Number(t.survey_count),
      aiCount: Number(t.ai_count),
      notifCount: Number(t.notif_count),
      lastResponseAt: t.last_response_at,
    })),
    dbSize: totalDbSize?.size ?? 'N/A',
  })
}

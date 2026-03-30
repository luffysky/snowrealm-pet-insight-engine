import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  // 驗證 super_admin 權限
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const [
    tenantCount,
    userCount,
    surveyCount,
    responseCount,
    todayCount,
    activeTenants,
    recentTenants,
  ] = await Promise.all([
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM tenants`),
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM admin_users`),
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM surveys`),
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM responses`),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM responses WHERE submitted_at >= CURRENT_DATE`
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT tenant_id) FROM responses WHERE submitted_at >= NOW() - INTERVAL '30 days'`
    ),
    query<{
      slug: string; name: string; plan: string; created_at: string;
      user_count: string; survey_count: string
    }>(
      `SELECT t.slug, t.name, COALESCE(t.plan, 'free') AS plan, t.created_at,
              (SELECT COUNT(*) FROM tenant_users tu WHERE tu.tenant_id = t.slug)::text AS user_count,
              (SELECT COUNT(*) FROM surveys s WHERE s.tenant_id = t.slug)::text AS survey_count
       FROM tenants t
       ORDER BY t.created_at DESC
       LIMIT 50`
    ),
  ])

  // 功能使用排行（依 API 路由呼叫頻率估算）
  const topFeatures = [
    { feature: '問卷回覆', count: Number(responseCount?.count ?? 0) },
    { feature: '問卷數', count: Number(surveyCount?.count ?? 0) },
    { feature: '管理員帳號', count: Number(userCount?.count ?? 0) },
  ]

  return NextResponse.json({
    totalTenants: Number(tenantCount?.count ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    totalSurveys: Number(surveyCount?.count ?? 0),
    totalResponses: Number(responseCount?.count ?? 0),
    todayResponses: Number(todayCount?.count ?? 0),
    activeTenants30d: Number(activeTenants?.count ?? 0),
    topFeatures,
    recentTenants: (recentTenants ?? []).map(t => ({
      slug: t.slug,
      name: t.name,
      plan: t.plan,
      created_at: t.created_at,
      userCount: Number(t.user_count),
      surveyCount: Number(t.survey_count),
    })),
  })
}

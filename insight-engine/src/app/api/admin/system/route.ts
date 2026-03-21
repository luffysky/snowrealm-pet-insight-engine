import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'
import { getTenantContext } from '@/lib/tenant'

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    // 平行查詢系統資訊
    const [
      surveyCount,
      questionCount,
      responseCount,
      waitlistCount,
      lineUserCount,
      tagRuleCount,
      notificationLogCount,
      templateCount,
      broadcastCount,
      todayResponses,
      recentNotifications,
      dbSize,
      adminUsers,
    ] = await Promise.all([
      queryOne<{ count: string }>('SELECT count(*) as count FROM surveys WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM questions WHERE survey_id IN (SELECT id FROM surveys WHERE tenant_id = $1)', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM responses WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM waitlist WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM line_users WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM tag_rules WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM notification_logs WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM message_templates WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>('SELECT count(*) as count FROM broadcast_logs WHERE tenant_id = $1', [tenantId]),
      queryOne<{ count: string }>(
        "SELECT count(*) as count FROM responses WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'", [tenantId]
      ),
      query<{ type: string; status: string; created_at: string }>(
        `SELECT trigger_type as type, status, created_at FROM notification_logs WHERE tenant_id = $1 ORDER BY created_at DESC FETCH FIRST 5 ROWS ONLY`, [tenantId]
      ),
      queryOne<{ size: string }>(
        "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
      ),
      query<{ id: string; username: string; display_name: string | null; role: string; created_at: string; line_user_id: string | null }>(
        'SELECT id, username, display_name, role, created_at, line_user_id FROM admin_users WHERE tenant_id = $1 ORDER BY created_at ASC', [tenantId]
      ),
    ])

    return NextResponse.json({
      tables: {
        surveys: Number(surveyCount?.count ?? 0),
        questions: Number(questionCount?.count ?? 0),
        responses: Number(responseCount?.count ?? 0),
        waitlist: Number(waitlistCount?.count ?? 0),
        lineUsers: Number(lineUserCount?.count ?? 0),
        tagRules: Number(tagRuleCount?.count ?? 0),
        notificationLogs: Number(notificationLogCount?.count ?? 0),
        templates: Number(templateCount?.count ?? 0),
        broadcasts: Number(broadcastCount?.count ?? 0),
      },
      todayResponses: Number(todayResponses?.count ?? 0),
      recentNotifications,
      adminUsers: adminUsers.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        role: u.role,
        createdAt: u.created_at,
        hasLine: !!u.line_user_id,
      })),
      dbSize: dbSize?.size ?? 'N/A',
      env: {
        hasLineOfficial: !!(await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN', tenantId)),
        hasLineInsight: !!(await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN', tenantId)),
        hasLiff: !!process.env.NEXT_PUBLIC_LIFF_ID,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'N/A',
      },
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[admin/system] Failed:', error)
    return NextResponse.json({ error: '系統資訊取得失敗' }, { status: 500 })
  }
}

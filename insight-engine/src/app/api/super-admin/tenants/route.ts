import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

/** 驗證 super_admin 權限 */
async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

interface TenantRow {
  [key: string]: unknown
  slug: string
  name: string
  plan: string
  created_at: string
  user_count: string
  survey_count: string
  response_count: string
  ai_usage_count: string
  notification_count: string
}

interface UserRow {
  [key: string]: unknown
  id: string
  username: string
  display_name: string | null
  email: string | null
  phone: string | null
  role: string
  tenant_id: string
  tenant_name: string
  created_at: string
  has_google: boolean
  has_line: boolean
  platform_unlimited: boolean
}

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') // 'tenants' | 'users' | 'tenant-detail'
  const tenantSlug = searchParams.get('slug')

  // 單一租戶詳情
  if (view === 'tenant-detail' && tenantSlug) {
    const [users, surveyCount, responseCount] = await Promise.all([
      query<UserRow>(
        `SELECT u.id, u.username, u.display_name, u.email, u.phone, u.role, u.tenant_id,
                t.name AS tenant_name, u.created_at,
                (u.google_id IS NOT NULL) AS has_google,
                (u.line_user_id IS NOT NULL) AS has_line,
                COALESCE(u.platform_unlimited, FALSE) AS platform_unlimited
         FROM admin_users u
         LEFT JOIN tenants t ON t.slug = u.tenant_id
         WHERE u.tenant_id = $1 AND u.deleted_at IS NULL
         ORDER BY u.created_at DESC`,
        [tenantSlug]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM surveys WHERE tenant_id = $1`,
        [tenantSlug]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM responses WHERE tenant_id = $1`,
        [tenantSlug]
      ),
    ])

    return NextResponse.json({
      users: (users ?? []).map(u => {
        const isPhone = /^\+[0-9]{7,15}$/.test(u.username)
        const authProvider = u.has_google ? 'google' : isPhone ? 'phone' : 'email'
        return {
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          tenantId: u.tenant_id,
          tenantName: u.tenant_name,
          createdAt: u.created_at,
          authProvider,
          hasLine: u.has_line,
          platformUnlimited: Boolean(u.platform_unlimited),
        }
      }),
      surveyCount: Number(surveyCount?.[0]?.count ?? 0),
      responseCount: Number(responseCount?.[0]?.count ?? 0),
    })
  }

  // 全平台使用者列表
  if (view === 'users') {
    const users = await query<UserRow>(
      `SELECT u.id, u.username, u.display_name, u.email, u.phone, u.role, u.tenant_id,
              t.name AS tenant_name, u.created_at,
              (u.google_id IS NOT NULL) AS has_google,
              (u.line_user_id IS NOT NULL) AS has_line,
              COALESCE(u.platform_unlimited, FALSE) AS platform_unlimited
       FROM admin_users u
       LEFT JOIN tenants t ON t.slug = u.tenant_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC
       LIMIT 200`
    )

    return NextResponse.json({
      users: (users ?? []).map(u => {
        // 判斷 authProvider：Google > 手機（E.164） > Email
        const isPhone = /^\+[0-9]{7,15}$/.test(u.username)
        const authProvider = u.has_google ? 'google' : isPhone ? 'phone' : 'email'
        return {
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          tenantId: u.tenant_id,
          tenantName: u.tenant_name,
          createdAt: u.created_at,
          authProvider,
          hasLine: u.has_line,
          platformUnlimited: Boolean(u.platform_unlimited),
        }
      }),
    })
  }

  // 預設：全部租戶列表（含用量統計）
  const tenants = await query<
    TenantRow & { has_platform_partner: boolean }
  >(
    `SELECT t.slug, t.name, t.plan, t.created_at,
            (SELECT COUNT(*) FROM admin_users u WHERE u.tenant_id = t.slug)::text AS user_count,
            (SELECT COUNT(*) FROM surveys s WHERE s.tenant_id = t.slug)::text AS survey_count,
            (SELECT COUNT(*) FROM responses r WHERE r.tenant_id = t.slug)::text AS response_count,
            COALESCE((SELECT COUNT(*) FROM ai_usage_logs a WHERE a.tenant_id = t.slug)::text, '0') AS ai_usage_count,
            COALESCE((SELECT COUNT(*) FROM notification_logs n WHERE n.tenant_id = t.slug)::text, '0') AS notification_count,
            EXISTS (
              SELECT 1 FROM admin_users u2
              WHERE u2.tenant_id = t.slug AND u2.deleted_at IS NULL AND COALESCE(u2.platform_unlimited, FALSE)
            ) AS has_platform_partner
     FROM tenants t
     ORDER BY t.created_at DESC`
  )

  return NextResponse.json({
    tenants: (tenants ?? []).map(t => ({
      slug: t.slug,
      name: t.name,
      plan: t.plan,
      createdAt: t.created_at,
      userCount: Number(t.user_count),
      surveyCount: Number(t.survey_count),
      responseCount: Number(t.response_count),
      aiUsageCount: Number(t.ai_usage_count),
      notificationCount: Number(t.notification_count),
      hasPlatformPartner: Boolean(t.has_platform_partner),
    })),
  })
}

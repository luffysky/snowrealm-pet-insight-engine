import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { queryOne, query } from '@/lib/db'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

interface TenantRow extends Record<string, unknown> {
  slug: string
  name: string
  admin_title?: string | null
}

export async function GET(): Promise<NextResponse> {
  // 直接讀取 JWT cookie（此路由不經過 middleware 注入 headers）
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const ctx = {
    tenantId: payload.tid,
    userId: payload.sub,
    role: payload.role,
    userName: payload.name,
  }

  // 取得當前租戶名稱與自訂後台名稱
  const tenant = await queryOne<TenantRow>(
    `SELECT t.slug, t.name, s.admin_title 
     FROM tenants t 
     LEFT JOIN site_settings s ON t.slug = s.tenant_id 
     WHERE t.slug = $1`,
    [ctx.tenantId],
  )

    let tenants: TenantRow[] = []
    tenants = await query<TenantRow>(
      `SELECT t.slug, t.name FROM tenant_users tu JOIN tenants t ON tu.tenant_id = t.slug WHERE tu.user_id = $1 AND t.is_active = true ORDER BY t.name`,
      [ctx.userId]
    )

  const platformPartner = await isUserPlatformUnlimited(ctx.userId)

  // 取得使用者額外欄位（avatarUrl、plan）
  const userRow = await queryOne<{ avatar_url: string | null; display_name: string | null }>(
    `SELECT avatar_url, display_name FROM admin_users WHERE id = $1`,
    [ctx.userId],
  )
  const tenantPlan = await queryOne<{ plan: string }>(
    `SELECT plan FROM tenants WHERE slug = $1`,
    [ctx.tenantId],
  )

  return NextResponse.json({
    userId: ctx.userId,
    userName: ctx.userName,
    displayName: userRow?.display_name ?? ctx.userName,
    role: ctx.role,
    tenantId: ctx.tenantId,
    tenantName: tenant?.name ?? ctx.tenantId,
    adminTitle: tenant?.admin_title || tenant?.name || '管理後台',
    tenants: tenants.length > 0 ? tenants : undefined,
    platformPartner,
    avatarUrl: userRow?.avatar_url ?? '',
    plan: tenantPlan?.plan ?? 'free',
  })
}

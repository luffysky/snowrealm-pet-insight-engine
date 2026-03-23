import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, type Role } from '@/lib/tenant'
import { queryOne } from '@/lib/db'
import { signToken } from '@/lib/jwt'

interface TenantUserRow extends Record<string, unknown> {
  slug: string
  name: string
  role: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await getTenantContext()

  const body = await request.json().catch(() => null)
  const targetSlug = body?.tenantId as string
  if (!targetSlug) {
    return NextResponse.json({ error: '請指定 tenantId' }, { status: 400 })
  }

  // super_admin 可切換到任何 active 租戶；一般使用者必須在 tenant_users 有權限
  let tenantRole: Role = ctx.role
  if (ctx.role === 'super_admin') {
    const tenant = await queryOne<{ slug: string; name: string; is_active: boolean } & Record<string, unknown>>(
      `SELECT slug, name, is_active FROM tenants WHERE slug = $1`, [targetSlug],
    )
    if (!tenant || !tenant.is_active) {
      return NextResponse.json({ error: '租戶不存在或已停用' }, { status: 404 })
    }
  } else {
    const tu = await queryOne<TenantUserRow>(
      `SELECT t.slug, t.name, tu.role FROM tenant_users tu JOIN tenants t ON tu.tenant_id = t.slug WHERE tu.user_id = $1 AND t.slug = $2 AND t.is_active = true`,
      [ctx.userId, targetSlug],
    )
    if (!tu) {
      return NextResponse.json({ error: '您沒有該組織的權限' }, { status: 403 })
    }
    tenantRole = tu.role as Role
  }

  const token = await signToken({
    sub: ctx.userId,
    tid: targetSlug,
    role: tenantRole,
    name: ctx.userName,
  })

  const response = NextResponse.json({
    success: true,
    tenantId: targetSlug,
  })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}

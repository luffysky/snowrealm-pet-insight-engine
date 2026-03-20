import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne } from '@/lib/db'
import { signToken } from '@/lib/jwt'

interface TenantRow extends Record<string, unknown> {
  slug: string
  name: string
  is_active: boolean
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await getTenantContext()
  if (ctx.role !== 'super_admin') {
    return NextResponse.json({ error: '僅 super_admin 可切換租戶' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const targetSlug = body?.tenantId as string
  if (!targetSlug) {
    return NextResponse.json({ error: '請指定 tenantId' }, { status: 400 })
  }

  const tenant = await queryOne<TenantRow>(
    `SELECT slug, name, is_active FROM tenants WHERE slug = $1`,
    [targetSlug],
  )
  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: '租戶不存在或已停用' }, { status: 404 })
  }

  // 簽發新 JWT 帶新 tenantId
  const token = await signToken({
    sub: ctx.userId,
    tid: tenant.slug,
    role: ctx.role,
    name: ctx.userName,
  })

  const response = NextResponse.json({
    success: true,
    tenantId: tenant.slug,
    tenantName: tenant.name,
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

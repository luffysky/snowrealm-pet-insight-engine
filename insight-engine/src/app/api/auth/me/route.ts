import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { queryOne, query } from '@/lib/db'

interface TenantRow extends Record<string, unknown> {
  slug: string
  name: string
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

  // 取得當前租戶名稱
  const tenant = await queryOne<TenantRow>(
    `SELECT slug, name FROM tenants WHERE slug = $1`,
    [ctx.tenantId],
  )

  // super_admin 可取得所有租戶列表
  let tenants: TenantRow[] = []
  if (ctx.role === 'super_admin') {
    tenants = await query<TenantRow>(
      `SELECT slug, name FROM tenants WHERE is_active = true ORDER BY name`,
    )
  }

  return NextResponse.json({
    userId: ctx.userId,
    userName: ctx.userName,
    role: ctx.role,
    tenantId: ctx.tenantId,
    tenantName: tenant?.name ?? ctx.tenantId,
    tenants: tenants.length > 0 ? tenants : undefined,
  })
}

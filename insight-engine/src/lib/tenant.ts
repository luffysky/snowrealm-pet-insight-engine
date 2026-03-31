import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export type Role = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface TenantContext {
  tenantId: string
  userId: string
  role: Role
  userName: string
}

/** Server Component / API Route：從 middleware 注入的 headers 取得租戶資訊 */
export async function getTenantContext(): Promise<TenantContext> {
  const h = await headers()
  return {
    tenantId: h.get('x-tenant-id') ?? 'default',
    userId: h.get('x-user-id') ?? '',
    role: (h.get('x-user-role') ?? 'viewer') as Role,
    userName: decodeURIComponent(h.get('x-user-name') ?? ''),
  }
}

/** 角色權力值 */
const ROLE_POWER: Record<string, number> = {
  super_admin: 100,
  admin: 50,
  editor: 20,
  viewer: 10,
}

/** 檢查角色是否 >= 某級別 */
export function hasMinRole(ctx: TenantContext, minRole: Role): boolean {
  return (ROLE_POWER[ctx.role] ?? 0) >= (ROLE_POWER[minRole] ?? 0)
}

/** API Route 用：取得租戶資訊並檢查最低角色。不符合時回傳 403 Response。 */
export async function requireRole(minRole: Role): Promise<TenantContext | NextResponse> {
  const ctx = await getTenantContext()
  if (!hasMinRole(ctx, minRole)) {
    return NextResponse.json({ error: `權限不足：需要 ${minRole} 以上角色` }, { status: 403 })
  }
  return ctx
}

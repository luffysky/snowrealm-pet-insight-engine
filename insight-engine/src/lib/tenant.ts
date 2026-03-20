import { headers } from 'next/headers'

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
    tenantId: h.get('x-tenant-id') ?? 'maoxingtianxia',
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

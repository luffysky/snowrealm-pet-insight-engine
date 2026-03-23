import type { NextRequest } from 'next/server'
import { verifyToken, type TokenPayload } from '@/lib/jwt'

/** 與 middleware 一致：JWT 內 role 或 tenants 含 super_admin */
export function isPayloadSuperAdmin(payload: TokenPayload): boolean {
  const tenants = payload.tenants || (payload.tid ? [{ tid: payload.tid, role: payload.role || 'admin' }] : [])
  return tenants.some(t => t.role === 'super_admin') || payload.role === 'super_admin'
}

export async function verifySuperAdminRequest(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || !isPayloadSuperAdmin(payload)) return null
  return payload
}

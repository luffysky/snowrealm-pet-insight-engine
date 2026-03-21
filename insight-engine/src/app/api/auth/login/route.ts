import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: '請輸入 Email / 手機 / 帳號和密碼' }, { status: 400 })
  }

  const loginId = (body.username as string).trim()

  // 支援 email 或 username 登入
  const user = await queryOne<{
    id: string
    password_hash: string
    tenant_id: string
    role: string
    display_name: string
  }>(
    `SELECT id, password_hash, tenant_id, role, display_name
     FROM admin_users
     WHERE username = $1 OR email = $1 OR phone = $1`,
    [loginId],
  )

  if (!user || !user.password_hash) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const valid = await verifyPassword(body.password as string, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const token = await signToken({
    sub: user.id,
    tid: user.tenant_id ?? 'default',
    role: user.role ?? 'admin',
    name: user.display_name ?? loginId,
  })

  const response = NextResponse.json({
    success: true,
    slug: user.tenant_id,
    user: { id: user.id, role: user.role, tenantId: user.tenant_id },
  })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  // 清除舊版 cookie
  response.cookies.delete('admin_token')

  return response
}

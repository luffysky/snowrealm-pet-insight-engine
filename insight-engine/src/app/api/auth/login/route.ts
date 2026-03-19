import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: '請輸入帳號和密碼' }, { status: 400 })
  }

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return NextResponse.json({ error: '系統未設定' }, { status: 500 })
  }

  // 從 DB 查帳號
  const user = await queryOne<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM admin_users WHERE username = $1`,
    [body.username],
  )

  if (!user || !user.password_hash) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const valid = await verifyPassword(body.password as string, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}

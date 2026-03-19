import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: '請輸入帳號和密碼' }, { status: 400 })
  }

  const expectedUsername = process.env.ADMIN_USERNAME
  const expectedPassword = process.env.ADMIN_PASSWORD
  const adminSecret = process.env.ADMIN_SECRET

  if (!expectedUsername || !expectedPassword || !adminSecret) {
    return NextResponse.json({ error: '管理員帳密未設定' }, { status: 500 })
  }

  if (body.username !== expectedUsername || body.password !== expectedPassword) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 天（配合每日動態 URL）
    path: '/',
  })

  return response
}

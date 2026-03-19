import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null)

    const token = (body?.token as string)?.trim()
    const username = (body?.username as string)?.trim()
    const password = (body?.password as string)

    if (!token || !username || !password) {
      return NextResponse.json({ error: '請填寫完整資料' }, { status: 400 })
    }

  // 帳號限制
  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: '帳號長度需 3～30 字元' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: '帳號只允許英文、數字、底線' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
  }

  // 驗證邀請 token
  const invite = await queryOne<{
    id: string
    line_user_id: string
    display_name: string | null
    used: boolean
    expires_at: Date
  }>(
    `SELECT id, line_user_id, display_name, used, expires_at FROM admin_invites WHERE token = $1`,
    [token],
  )

  if (!invite) {
    return NextResponse.json({ error: '邀請連結無效' }, { status: 400 })
  }
  if (invite.used) {
    return NextResponse.json({ error: '此邀請連結已被使用' }, { status: 400 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: '邀請連結已過期，請重新取得' }, { status: 400 })
  }

  // 檢查帳號是否已存在
  const existing = await queryOne(
    `SELECT id FROM admin_users WHERE username = $1`,
    [username],
  )
  if (existing) {
    return NextResponse.json({ error: '帳號已被使用，請換一個' }, { status: 409 })
  }

  // 建立管理員帳號
  const passwordHash = await hashPassword(password)
  await query(
    `INSERT INTO admin_users (username, password_hash, display_name, line_user_id, role)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [username, passwordHash, invite.display_name, invite.line_user_id],
  )

  // 標記 token 已使用
  await query(`UPDATE admin_invites SET used = true WHERE id = $1`, [invite.id])

  // 同時在 line_admins 註冊（接收通知）
  if (invite.line_user_id) {
    await query(
      `INSERT INTO line_admins (line_user_id, display_name, active)
       VALUES ($1, $2, true)
       ON CONFLICT (line_user_id) DO UPDATE SET active = true, display_name = COALESCE($2, line_admins.display_name)`,
      [invite.line_user_id, invite.display_name],
    )
  }

  // 註冊完自動登入 → 設 cookie
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret) {
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

  return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Register API Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { notifyUserLogin } from '@/lib/lineNotify'
import { completeTask } from '@/lib/dailyTaskEngine'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: '請輸入 Email / 手機 / 帳號和密碼' }, { status: 400 })
  }

  const loginId = (body.username as string).trim()
  const inviteToken = (body.invite as string)?.trim()

  // 標準化：若輸入 09xxxxxxxx 格式，轉成 E.164 +886xxxxxxxxx 以對應資料庫
  const normalizedId = /^09[0-9]{8}$/.test(loginId) ? '+886' + loginId.slice(1) : loginId

  // 支援 email 或 username 登入（同時試原始輸入和標準化後的格式）
  const user = await queryOne<{
    id: string
    password_hash: string
    tenant_id: string
    role: string
    display_name: string
  }>(
    `SELECT id, password_hash, tenant_id, role, display_name
     FROM admin_users
     WHERE username = $1 OR email = $1 OR phone = $1
        OR username = $2 OR email = $2 OR phone = $2`,
    [loginId, normalizedId],
  )

  if (!user || !user.password_hash) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const valid = await verifyPassword(body.password as string, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  // 1. 若有攜帶邀請碼，則直接綁定新租戶權限
  if (inviteToken) {
    const invite = await queryOne<{ id: string; tenant_id: string; role: string }>(
      `SELECT id, tenant_id, role FROM admin_invites WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [inviteToken]
    )
    if (invite) {
      await query(
        `INSERT INTO tenant_users (tenant_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [invite.tenant_id, user.id, invite.role]
      )
      await query(`UPDATE admin_invites SET used = true WHERE id = $1`, [invite.id])
    }
  }

  // 2. 獲取該用戶所有已授權的租戶列表
  const tenantRows = await query<{ tenant_id: string; role: string }>(
    `SELECT tenant_id, role FROM tenant_users WHERE user_id = $1`,
    [user.id]
  )
  const tenants = tenantRows.map((r: any) => ({ tid: r.tenant_id, role: r.role }))
  // Fallback: 若資料庫還未建立或剛轉換，保留原 admin_users 身上的權限
  if (tenants.length === 0 && user.tenant_id) {
    tenants.push({ tid: user.tenant_id, role: user.role })
  }

  const defaultTid = tenants.length > 0 ? tenants[0].tid : 'default'

  const SESSION_SECONDS = 60 * 60 * 24 * 30 // 30 天
  // super_admin 帳號必須保留真實 role，不能被 tenant role 覆蓋
  // 否則 guide engine / middleware 讀 JWT 永遠看到 'admin' 而非 'super_admin'
  const jwtRole = user.role === 'super_admin'
    ? 'super_admin'
    : (tenants.length > 0 ? tenants[0].role : 'admin')

  const token = await signToken(
    {
      sub: user.id,
      tenants,
      tid: defaultTid,
      role: jwtRole,
      name: user.display_name ?? loginId,
    },
    SESSION_SECONDS,
  )

  // LINE Notify 通知
  notifyUserLogin({
    method: 'password',
    identifier: loginId,
    displayName: user.display_name,
    tenantId: defaultTid,
  })

  // 每日登入 Z幣任務（非阻塞）
  completeTask(user.id, 'daily_login', defaultTid).catch(() => {})

  // Mobile callback：多回傳 token 讓 app 端存
  const mobileCallback = body.mobile_callback as string | undefined

  const response = NextResponse.json({
    success: true,
    slug: defaultTid,
    user: { id: user.id, role: tenants[0]?.role || user.role, tenantId: defaultTid, tenants },
    ...(mobileCallback ? { token } : {}),
  })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_SECONDS,
    path: '/',
  })
  // 清除舊版 cookie
  response.cookies.delete('admin_token')

  return response
}

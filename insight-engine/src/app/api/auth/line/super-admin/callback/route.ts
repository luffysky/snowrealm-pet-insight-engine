import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { signToken } from '@/lib/jwt'

interface LineTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  scope: string
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

/** 簽發短命 pending token（5 分鐘）
 * sub = adminUserId, name = lineUserId, role = 'sa_pending' */
async function signPendingToken(lineUserId: string, adminUserId: string): Promise<string> {
  return signToken({ sub: adminUserId, name: lineUserId, role: 'sa_pending' }, 300)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const storedState = request.cookies.get('line_sa_state')?.value

    if (!code) return NextResponse.redirect(`${baseUrl}/super-login?error=missing_code`)
    if (!state || state !== storedState) return NextResponse.redirect(`${baseUrl}/super-login?error=invalid_state`)

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID!
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!
    const callbackUrl = `${baseUrl}/api/auth/line/super-admin/callback`
    const allowedUserId = process.env.SUPER_ADMIN_LINE_USER_ID || process.env.LINE_YOUR_USER_ID

    // Code → Token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    })
    if (!tokenRes.ok) return NextResponse.redirect(`${baseUrl}/super-login?error=token_exchange`)

    const tokenData: LineTokenResponse = await tokenRes.json()

    // Token → Profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!profileRes.ok) return NextResponse.redirect(`${baseUrl}/super-login?error=profile_error`)

    const lineProfile: LineProfile = await profileRes.json()

    // ★ 核心安全檢查：只允許指定的 LINE User ID
    if (!allowedUserId || lineProfile.userId !== allowedUserId) {
      // Log unauthorized attempt
      try {
        await execute(
          `INSERT INTO audit_logs (action, actor_id, actor_name, details, created_at)
           VALUES ('super_admin_login_rejected', $1, $2, $3, NOW())`,
          [lineProfile.userId, lineProfile.displayName, JSON.stringify({ reason: 'unauthorized_line_id' })]
        )
      } catch { /* audit table may not exist */ }
      console.warn(`[Super Admin] Unauthorized attempt: ${lineProfile.userId} (${lineProfile.displayName})`)
      return NextResponse.redirect(`${baseUrl}/`)
    }

    // 找對應的 admin 帳號（只查有綁定 line_id 的，不自動升權）
    let user = await queryOne<{ id: string; role: string; display_name: string }>(
      `SELECT id, role, display_name FROM admin_users WHERE line_id = $1`,
      [lineProfile.userId],
    )

    if (!user) {
      // 只在明確有 super_admin 帳號時才允許綁定，不自動找最老帳號
      const existing = await queryOne<{ id: string; role: string; display_name: string }>(
        `SELECT id, role, display_name FROM admin_users WHERE role = 'super_admin' LIMIT 1`,
      )
      if (!existing) return NextResponse.redirect(`${baseUrl}/super-login?error=no_account`)

      await execute(
        `UPDATE admin_users SET line_id = $1 WHERE id = $2`,
        [lineProfile.userId, existing.id],
      )
      user = existing
    }

    if (user.role !== 'super_admin') {
      return NextResponse.redirect(`${baseUrl}/super-login?error=not_super_admin`)
    }

    // 簽發 pending token（不是完整 session，5 分鐘）
    const pendingToken = await signPendingToken(lineProfile.userId, user.id)

    const response = NextResponse.redirect(`${baseUrl}/super-login?step=pin`)
    response.cookies.set('sa_pending', pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300, // 5 minutes
      path: '/',
    })
    response.cookies.delete('line_sa_state')
    return response
  } catch (err) {
    console.error('[Super Admin LINE Callback Error]', err)
    return NextResponse.redirect(`${baseUrl}/super-login?error=server_error`)
  }
}

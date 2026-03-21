import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
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

/** Step 2: LINE 回呼 → 用 code 換 token → 取 profile → 登入/註冊 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const storedState = request.cookies.get('line_oauth_state')?.value

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
    }
    if (!state || state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID!
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!
    const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL
      || `${baseUrl}/api/auth/line/callback`

    // 用 authorization code 換 access token
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

    if (!tokenRes.ok) {
      console.error('[LINE OAuth] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange`)
    }

    const tokenData: LineTokenResponse = await tokenRes.json()

    // 用 access token 取 profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!profileRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=profile_error`)
    }

    const lineProfile: LineProfile = await profileRes.json()

    // 查找既有用戶（先查 line_id）
    let user = await queryOne<{
      id: string; tenant_id: string; role: string; display_name: string
    }>(
      `SELECT id, tenant_id, role, display_name FROM admin_users WHERE line_id = $1`,
      [lineProfile.userId],
    )

    if (!user) {
      // 全新用戶 → 自動註冊（建 tenant + admin user）
      const slug = `line-${Date.now().toString(36)}`
      const tenant = await queryOne<{ slug: string }>(
        `INSERT INTO tenants (name, slug, plan, is_active)
         VALUES ($1, $2, 'free', true) RETURNING slug`,
        [lineProfile.displayName, slug],
      )

      const pwHash = await hashPassword(lineProfile.userId)
      const username = `line_${lineProfile.userId.slice(-8)}`

      const newUser = await queryOne<{ id: string }>(
        `INSERT INTO admin_users (username, password_hash, display_name, line_id, role, tenant_id)
         VALUES ($1, $2, $3, $4, 'admin', $5) RETURNING id`,
        [username, pwHash, lineProfile.displayName, lineProfile.userId, tenant?.slug ?? slug],
      )

      // 建立預設 site_settings
      await query(
        `INSERT INTO site_settings (tenant_id, site_title, site_description)
         VALUES ($1, $2, $3) ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant?.slug ?? slug, lineProfile.displayName, `${lineProfile.displayName} 問卷系統`],
      )

      user = {
        id: newUser?.id ?? '',
        tenant_id: tenant?.slug ?? slug,
        role: 'admin',
        display_name: lineProfile.displayName,
      }
    }

    // 簽發 JWT
    const jwt = await signToken({
      sub: user.id,
      tid: user.tenant_id,
      role: user.role,
      name: user.display_name,
    })

    const response = NextResponse.redirect(`${baseUrl}/insight-admin/${user.tenant_id}`)
    response.cookies.set('admin_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    // 清除 state cookie
    response.cookies.delete('line_oauth_state')
    return response
  } catch (err) {
    console.error('[LINE OAuth Callback Error]', err)
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`)
  }
}

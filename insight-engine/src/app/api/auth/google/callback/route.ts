import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { notifyNewRegistration, notifyUserLogin } from '@/lib/lineNotify'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture: string
  email_verified: boolean
}

/** Step 2: Google 回呼 → 用 code 換 token → 取 user info → 登入/註冊 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
    }

    const callbackUrl = process.env.GOOGLE_CALLBACK_URL
      || `${baseUrl}/api/auth/google/callback`

    // 用 authorization code 換 access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[Google OAuth] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange`)
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json()

    // 用 access token 取用戶資料
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=user_info`)
    }

    const googleUser: GoogleUserInfo = await userRes.json()

    // 查找既有用戶（先查 google_id，再查 email 當作 username）
    let user = await queryOne<{
      id: string; tenant_id: string; role: string; display_name: string
    }>(
      `SELECT id, tenant_id, role, display_name FROM admin_users WHERE google_id = $1`,
      [googleUser.sub],
    )

    if (!user) {
      // 用完整 email 或 email 前綴比對（支援不同的 username 格式）
      const emailPrefix = googleUser.email.split('@')[0]
      user = await queryOne<{
        id: string; tenant_id: string; role: string; display_name: string
      }>(
        `SELECT id, tenant_id, role, display_name FROM admin_users
         WHERE email = $1 OR username = $1 OR username = $2
         ORDER BY created_at ASC LIMIT 1`,
        [googleUser.email, emailPrefix],
      )

      if (user) {
        // 綁定 google_id
        await query(`UPDATE admin_users SET google_id = $1 WHERE id = $2`, [googleUser.sub, user.id])
      }
    }

    if (!user) {
      // 全新用戶 → 自動註冊（建 tenant + admin user）
      const slug = `org-${Date.now().toString(36)}`
      const tenant = await queryOne<{ slug: string }>(
        `INSERT INTO tenants (name, slug, plan, is_active)
         VALUES ($1, $2, 'free', true) RETURNING slug`,
        [googleUser.name, slug],
      )

      const passwordHash = await hashPassword(googleUser.sub)
      const username = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)

      const newUser = await queryOne<{ id: string }>(
        `INSERT INTO admin_users (username, password_hash, display_name, google_id, role, tenant_id)
         VALUES ($1, $2, $3, $4, 'admin', $5) RETURNING id`,
        [username, passwordHash, googleUser.name, googleUser.sub, tenant?.slug ?? slug],
      )

      // 建立預設 site_settings
      await query(
        `INSERT INTO site_settings (tenant_id, site_title, site_description)
         VALUES ($1, $2, $3) ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant?.slug ?? slug, googleUser.name, `${googleUser.name} 問卷系統`],
      )

      user = {
        id: newUser?.id ?? '',
        tenant_id: tenant?.slug ?? slug,
        role: 'admin',
        display_name: googleUser.name,
      }

      notifyNewRegistration({
        method: 'google',
        email: googleUser.email,
        displayName: googleUser.name,
        slug: tenant?.slug ?? slug,
      })
    } else {
      notifyUserLogin({
        method: 'google',
        identifier: googleUser.email,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      })
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
    return response
  } catch (err) {
    console.error('[Google OAuth Callback Error]', err)
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`)
  }
}

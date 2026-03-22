import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
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

/**
 * 總後台專用 LINE Login callback
 * 只允許 SUPER_ADMIN_LINE_USER_ID 登入，其他人一律拒絕
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const storedState = request.cookies.get('line_sa_state')?.value

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/super-login?error=missing_code`)
    }
    if (!state || state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/super-login?error=invalid_state`)
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID!
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!
    const callbackUrl = `${baseUrl}/api/auth/line/super-admin/callback`

    // 允許的管理員 LINE User ID
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

    if (!tokenRes.ok) {
      console.error('[Super Admin LINE] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${baseUrl}/super-login?error=token_exchange`)
    }

    const tokenData: LineTokenResponse = await tokenRes.json()

    // Token → Profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!profileRes.ok) {
      return NextResponse.redirect(`${baseUrl}/super-login?error=profile_error`)
    }

    const lineProfile: LineProfile = await profileRes.json()

    // ★ 核心安全檢查：只允許指定的 LINE User ID
    if (lineProfile.userId !== allowedUserId) {
      console.warn(`[Super Admin LINE] Unauthorized: ${lineProfile.userId} (${lineProfile.displayName})`)
      return NextResponse.redirect(`${baseUrl}/`)
    }

    // 查找或綁定 super_admin 帳號
    let user = await queryOne<{
      id: string; tenant_id: string; role: string; display_name: string
    }>(
      `SELECT id, tenant_id, role, display_name FROM admin_users WHERE line_id = $1`,
      [lineProfile.userId],
    )

    if (user) {
      // 確保是 super_admin
      if (user.role !== 'super_admin') {
        await queryOne(
          `UPDATE admin_users SET role = 'super_admin' WHERE id = $1 RETURNING id`,
          [user.id],
        )
        user.role = 'super_admin'
      }
    } else {
      // 1) 先找既有的 super_admin 帳號
      let existing = await queryOne<{
        id: string; tenant_id: string; role: string; display_name: string
      }>(
        `SELECT id, tenant_id, role, display_name FROM admin_users WHERE role = 'super_admin' LIMIT 1`,
      )

      // 2) 沒有 super_admin → 找任何一個 admin 帳號升級
      if (!existing) {
        existing = await queryOne<{
          id: string; tenant_id: string; role: string; display_name: string
        }>(
          `SELECT id, tenant_id, role, display_name FROM admin_users ORDER BY created_at ASC LIMIT 1`,
        )
      }

      if (existing) {
        // 綁定 line_id + 升級為 super_admin
        await queryOne(
          `UPDATE admin_users SET line_id = $1, role = 'super_admin' WHERE id = $2 RETURNING id`,
          [lineProfile.userId, existing.id],
        )
        user = { ...existing, role: 'super_admin' }
        console.log(`[Super Admin LINE] Bound line_id and promoted to super_admin: ${existing.id}`)
      } else {
        return NextResponse.redirect(`${baseUrl}/super-login?error=no_account`)
      }
    }

    // 簽發 JWT（super_admin 角色）
    const jwt = await signToken({
      sub: user.id,
      tid: user.tenant_id,
      role: 'super_admin',
      name: user.display_name,
    })

    const response = NextResponse.redirect(`${baseUrl}/snowrealm-insight-ctrl`)
    response.cookies.set('admin_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    response.cookies.delete('line_sa_state')
    return response
  } catch (err) {
    console.error('[Super Admin LINE Callback Error]', err)
    return NextResponse.redirect(`${baseUrl}/super-login?error=server_error`)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { notifyNewRegistration, notifyUserLogin } from '@/lib/lineNotify'

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
    const error = request.nextUrl.searchParams.get('error')
    const storedState = request.cookies.get('line_oauth_state')?.value

    // LINE 使用者拒絕授權
    if (error) {
      console.error('[LINE OAuth] User denied or error:', error)
      return NextResponse.redirect(`${baseUrl}/login?error=line_denied`)
    }

    if (!code) {
      console.error('[LINE OAuth] No code in callback')
      return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
    }

    // 嘗試解碼 state（Mobile app 把 mobile_callback 編碼在 state 裡）
    let mobileCallbackFromState: string | null = null
    let stateValid = false
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
        if (decoded.nonce && decoded.mobile_callback) {
          // Mobile flow：state 自帶 mobile_callback，不需 cookie 驗證
          mobileCallbackFromState = decoded.mobile_callback
          stateValid = true
        }
      } catch {
        // 非 JSON — 普通 UUID state，用 cookie 驗證
      }
    }
    if (!stateValid) {
      if (!state || state !== storedState) {
        console.error('[LINE OAuth] State mismatch:', { state, storedState: storedState ? 'exists' : 'missing' })
        return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
      }
      stateValid = true
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
    if (!channelId || !channelSecret) {
      console.error('[LINE OAuth] Missing channel config')
      return NextResponse.redirect(`${baseUrl}/login?error=line_not_configured`)
    }

    const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL
      || `${baseUrl}/api/auth/line/callback`

    console.log('[LINE OAuth] Token exchange attempt:', {
      callbackUrl,
      channelId,
      codePrefix: code.slice(0, 8) + '...',
    })

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
      const errBody = await tokenRes.text()
      console.error('[LINE OAuth] Token exchange failed:', errBody, { callbackUrl, channelId })
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

    // 取得暫存的 invite token
    const inviteToken = request.cookies.get('line_oauth_invite')?.value

    // ── 檢查邀請碼 ──
    let inviteData: { id: string; tenant_id: string; role: string } | null = null
    if (inviteToken) {
      inviteData = await queryOne<{ id: string; tenant_id: string; role: string }>(
        `SELECT id, tenant_id, role FROM admin_invites WHERE token = $1 AND used = false AND expires_at > NOW()`,
        [inviteToken]
      )
    }

    // 查找既有用戶（先查 line_id）
    let user = await queryOne<{
      id: string; tenant_id: string; role: string; display_name: string
    }>(
      `SELECT id, tenant_id, role, display_name FROM admin_users WHERE line_id = $1`,
      [lineProfile.userId],
    )

    let finalTenantId = user?.tenant_id || ''

    if (!user) {
      // 全新用戶
      const pwHash = await hashPassword(lineProfile.userId)
      const username = `line_${lineProfile.userId.slice(-8)}`

      if (inviteData) {
        // 受邀：不建立新組織，使用邀請的組織
        finalTenantId = inviteData.tenant_id
        const newUser = await queryOne<{ id: string }>(
          `INSERT INTO admin_users (username, password_hash, display_name, line_id, role, tenant_id)
           VALUES ($1, $2, $3, $4, 'admin', $5) RETURNING id`,
          [username, pwHash, lineProfile.displayName, lineProfile.userId, finalTenantId],
        )
        user = {
          id: newUser?.id ?? '',
          tenant_id: finalTenantId,
          role: 'admin',
          display_name: lineProfile.displayName,
        }
      } else {
        // 自行註冊：建立新組織 (建 tenant + admin user)
        const slug = `line-${Date.now().toString(36)}`
        const tenant = await queryOne<{ slug: string }>(
          `INSERT INTO tenants (name, slug, plan, is_active)
           VALUES ($1, $2, 'free', true) RETURNING slug`,
          [lineProfile.displayName, slug],
        )
        finalTenantId = tenant?.slug ?? slug

        const newUser = await queryOne<{ id: string }>(
          `INSERT INTO admin_users (username, password_hash, display_name, line_id, role, tenant_id)
           VALUES ($1, $2, $3, $4, 'admin', $5) RETURNING id`,
          [username, pwHash, lineProfile.displayName, lineProfile.userId, finalTenantId],
        )

        // 建立預設 site_settings
        await query(
          `INSERT INTO site_settings (tenant_id, site_title, site_description)
           VALUES ($1, $2, $3) ON CONFLICT (tenant_id) DO NOTHING`,
          [finalTenantId, lineProfile.displayName, `${lineProfile.displayName} 問卷系統`],
        )

        user = {
          id: newUser?.id ?? '',
          tenant_id: finalTenantId,
          role: 'admin',
          display_name: lineProfile.displayName,
        }
      }
      
      notifyNewRegistration({
        method: 'line',
        displayName: lineProfile.displayName,
        slug: finalTenantId,
      })
    } else {
      notifyUserLogin({
        method: 'line',
        identifier: `LINE ${lineProfile.displayName}`,
        displayName: user.display_name,
        tenantId: user.tenant_id,
      })
    }

    // ── 寫入 tenant_users 與 更新邀請碼狀態 ──
    if (inviteData) {
      await query(
        `INSERT INTO tenant_users (tenant_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [inviteData.tenant_id, user.id, inviteData.role]
      )
      await query(`UPDATE admin_invites SET used = true WHERE id = $1`, [inviteData.id])
    } else if (finalTenantId) {
      // 給自行建立組織的人也新增一份 tenant_users 映射
      await query(
        `INSERT INTO tenant_users (tenant_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
        [finalTenantId, user.id]
      )
    }

    // ── 獲取該用戶所有已授權的租戶列表 ──
    const tenantRows = await query<{ tenant_id: string; role: string }>(
      `SELECT tenant_id, role FROM tenant_users WHERE user_id = $1`,
      [user.id]
    )
    const tenants = tenantRows.map(r => ({ tid: r.tenant_id, role: r.role }))
    if (tenants.length === 0 && user.tenant_id) {
      tenants.push({ tid: user.tenant_id, role: user.role })
    }
    const defaultTid = tenants.length > 0 ? tenants[0].tid : 'default'

    // 簽發 JWT
    const jwt = await signToken({
      sub: user.id,
      tenants,
      tid: defaultTid,
      role: tenants[0]?.role || user.role,
      name: user.display_name,
    })

    // 檢查是否為 Mobile App 回調（優先用 state 裡的，fallback cookie）
    const mobileCallback = mobileCallbackFromState
      || request.cookies.get('oauth_mobile_callback')?.value

    let response: NextResponse
    if (mobileCallback) {
      // Mobile App：redirect 到 app deep link 帶 token
      const callbackUrl = new URL(mobileCallback)
      callbackUrl.searchParams.set('token', jwt)
      response = NextResponse.redirect(callbackUrl.toString())
      response.cookies.delete('oauth_mobile_callback')
    } else {
      // Web：redirect 到後台
      response = NextResponse.redirect(`${baseUrl}/insight-admin/${defaultTid}`)
    }

    response.cookies.set('admin_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    // 清除 state 與 invite cookie
    response.cookies.delete('line_oauth_state')
    response.cookies.delete('line_oauth_invite')
    return response
  } catch (err) {
    console.error('[LINE OAuth Callback Error]', err)
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`)
  }
}

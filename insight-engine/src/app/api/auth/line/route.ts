import { NextRequest, NextResponse } from 'next/server'

/**
 * LINE Login OAuth 2.1 — Step 1: 導向 LINE 授權頁
 *
 * 環境變數：
 * - LINE_LOGIN_CHANNEL_ID
 * - LINE_LOGIN_CHANNEL_SECRET
 * - LINE_LOGIN_CALLBACK_URL（可選，預設自動產生）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL
    || `${baseUrl}/api/auth/line/callback`

  if (!channelId || !channelSecret) {
    console.error('[LINE Login] Missing env vars:', {
      LINE_LOGIN_CHANNEL_ID: !!channelId,
      LINE_LOGIN_CHANNEL_SECRET: !!channelSecret,
    })
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/login?error=line_not_configured`)
  }

  // CSRF 防護
  const nonce = crypto.randomUUID()
  const inviteToken = request.nextUrl.searchParams.get('invite')
  const mobileCallback = request.nextUrl.searchParams.get('mobile_callback')

  // Mobile app：把 mobile_callback 編碼進 state（cookie 在跨 app 瀏覽器不通）
  const state = mobileCallback
    ? Buffer.from(JSON.stringify({ nonce, mobile_callback: mobileCallback })).toString('base64url')
    : nonce

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: callbackUrl,
    state,
    scope: 'profile openid email',
  })

  const lineUrl = `https://access.line.me/oauth2/v2.1/authorize?${params}`

  // 一律 302 redirect（mobile_callback 已編碼在 state 裡，callback 時取回）
  const response = NextResponse.redirect(lineUrl)
  response.cookies.set('line_oauth_state', state, {
    httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/',
  })

  if (inviteToken) {
    response.cookies.set('line_oauth_invite', inviteToken, {
      httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/',
    })
  }

  return response
}

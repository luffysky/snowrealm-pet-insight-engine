import { NextRequest, NextResponse } from 'next/server'

/**
 * 總後台專用 LINE Login — redirect
 * 跟一般 LINE Login 分開，callback 會檢查是否為指定管理員
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const callbackUrl = `${baseUrl}/api/auth/line/super-admin/callback`

  if (!channelId || !channelSecret) {
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/super-login?error=line_not_configured`)
  }

  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: callbackUrl,
    state,
    scope: 'profile openid email',
  })

  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  )
  response.cookies.set('line_sa_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}

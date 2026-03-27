import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Rate limit: max 5 attempts per IP per minute
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const rl = checkRateLimit(`sa-login:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/super-login?error=rate_limited`)
  }

  if (!channelId) {
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/super-login?error=line_not_configured`)
  }

  const state = crypto.randomUUID()
  const callbackUrl = `${baseUrl}/api/auth/line/super-admin/callback`

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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}

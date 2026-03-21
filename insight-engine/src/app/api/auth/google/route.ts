import { NextRequest, NextResponse } from 'next/server'

/** Step 1: 導向 Google 授權頁 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
    || `${baseUrl}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] Missing env vars:', {
      GOOGLE_CLIENT_ID: !!clientId,
      GOOGLE_CLIENT_SECRET: !!clientSecret,
      GOOGLE_CALLBACK_URL: callbackUrl,
    })
    // 導回登入頁帶錯誤提示
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

import { NextResponse } from 'next/server'

/** Step 1: 導向 Google 授權頁 */
export async function GET(): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
    || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'Google OAuth 尚未設定' }, { status: 500 })
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

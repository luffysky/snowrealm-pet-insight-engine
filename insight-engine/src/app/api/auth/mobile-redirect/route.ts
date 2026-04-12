import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/mobile-redirect?token=xxx&callback=yukiboard://auth/callback
 *
 * 用 HTTP 302 redirect 把 token 帶回 App。
 * Chrome Custom Tab 對 302 redirect 到 custom scheme 的處理
 * 比 JavaScript window.location.href 更可靠。
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  const callback = req.nextUrl.searchParams.get('callback')

  if (!token || !callback) {
    return NextResponse.json({ error: 'Missing token or callback' }, { status: 400 })
  }

  const redirectUrl = `${callback}?token=${encodeURIComponent(token)}`
  return NextResponse.redirect(redirectUrl, 302)
}

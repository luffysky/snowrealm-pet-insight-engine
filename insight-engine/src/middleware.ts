import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // 後台頁面與 API 需要驗證
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next()
  }

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    // 未設定 ADMIN_SECRET 時放行（開發階段）
    return NextResponse.next()
  }

  // 檢查 cookie 或 header
  const cookieToken = request.cookies.get('admin_token')?.value
  const headerToken = request.headers.get('x-admin-secret')
  const queryToken = request.nextUrl.searchParams.get('token')

  const isAuthorized =
    cookieToken === adminSecret ||
    headerToken === adminSecret ||
    queryToken === adminSecret

  if (isAuthorized) {
    // 若透過 query token 認證，設定 cookie 以免每次都帶
    if (queryToken === adminSecret && !cookieToken) {
      const response = NextResponse.redirect(
        new URL(pathname, request.url)
      )
      response.cookies.set('admin_token', adminSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 天
        path: '/',
      })
      return response
    }
    return NextResponse.next()
  }

  // 未授權
  if (isAdminApi) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  return new NextResponse('未授權：請提供正確的 admin token', { status: 401 })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

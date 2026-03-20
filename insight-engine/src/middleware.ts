import { NextRequest, NextResponse } from 'next/server'

/** 取得台灣時間的 MM-DD */
function getTaiwanDateSlug(): string {
  const now = new Date()
  // 用 UTC+8 計算
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const tw = new Date(utc + 8 * 3600000)
  const mm = String(tw.getMonth() + 1).padStart(2, '0')
  const dd = String(tw.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

function isAuthorized(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return true // 開發階段放行
  const cookieToken = request.cookies.get('admin_token')?.value
  const headerToken = request.headers.get('x-admin-secret')
  return cookieToken === adminSecret || headerToken === adminSecret
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Login / Register / Auth API — 永遠放行
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // 動態 admin URL: /admin-MM-DD/...
  const dynamicMatch = pathname.match(/^\/admin-(\d{2}-\d{2})(\/.*)?$/)
  if (dynamicMatch) {
    const dateSlug = dynamicMatch[1]
    const rest = dynamicMatch[2] || ''
    const todaySlug = getTaiwanDateSlug()

    if (dateSlug !== todaySlug) {
      return new NextResponse('連結已過期，請使用今日的管理後台網址', { status: 403 })
    }

    if (!isAuthorized(request)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Rewrite 到實際的 /admin/... 路徑
    return NextResponse.rewrite(new URL(`/admin${rest}`, request.url))
  }

  // Admin 頁面 /admin/...
  if (pathname.startsWith('/admin')) {
    if (!isAuthorized(request)) {
      // 未登入 → 導向 login
      const todaySlug = getTaiwanDateSlug()
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', `/admin-${todaySlug}${pathname.slice('/admin'.length)}`)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Admin API /api/admin/...
  if (pathname.startsWith('/api/admin')) {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/(admin-\\d{2}-\\d{2})/:path*', '/(admin-\\d{2}-\\d{2})', '/api/admin/:path*', '/login', '/register'],
}

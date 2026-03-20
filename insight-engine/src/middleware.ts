import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type TokenPayload } from '@/lib/jwt'

/** 取得台灣時間的 MM-DD */
function getTaiwanDateSlug(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const tw = new Date(utc + 8 * 3600000)
  const mm = String(tw.getMonth() + 1).padStart(2, '0')
  const dd = String(tw.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/** 解析 JWT 或 legacy 認證，回傳 payload 或 null */
async function getAuthContext(request: NextRequest): Promise<TokenPayload | null> {
  // JWT-based
  const sessionToken = request.cookies.get('admin_session')?.value
  if (sessionToken) {
    const payload = await verifyToken(sessionToken)
    if (payload) return payload
  }
  // Legacy: x-admin-secret header（cron/server-to-server）
  const headerToken = request.headers.get('x-admin-secret')
  if (headerToken && headerToken === process.env.ADMIN_SECRET) {
    return { sub: 'system', tid: 'maoxingtianxia', role: 'super_admin', name: 'System', exp: 0 }
  }
  // Legacy: 舊版 admin_token cookie（過渡期）
  const oldToken = request.cookies.get('admin_token')?.value
  if (oldToken && oldToken === process.env.ADMIN_SECRET) {
    return { sub: 'legacy', tid: 'maoxingtianxia', role: 'super_admin', name: 'Legacy', exp: 0 }
  }
  return null
}

/** 將 auth payload 注入 request headers，供下游 API/page 讀取 */
function withTenantHeaders(request: NextRequest, auth: TokenPayload): Headers {
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', auth.tid)
  headers.set('x-user-id', auth.sub)
  headers.set('x-user-role', auth.role)
  headers.set('x-user-name', encodeURIComponent(auth.name))
  return headers
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
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
    if (dateSlug !== getTaiwanDateSlug()) {
      return new NextResponse('連結已過期，請使用今日的管理後台網址', { status: 403 })
    }
    const auth = await getAuthContext(request)
    if (!auth) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.rewrite(new URL(`/admin${rest}`, request.url), {
      request: { headers: withTenantHeaders(request, auth) },
    })
  }

  // Admin 頁面 /admin/...
  if (pathname.startsWith('/admin')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      const todaySlug = getTaiwanDateSlug()
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', `/admin-${todaySlug}${pathname.slice('/admin'.length)}`)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth) },
    })
  }

  // Admin API /api/admin/...
  if (pathname.startsWith('/api/admin')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }
    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth) },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/(admin-\\d{2}-\\d{2})/:path*', '/(admin-\\d{2}-\\d{2})', '/api/admin/:path*', '/login', '/register'],
}

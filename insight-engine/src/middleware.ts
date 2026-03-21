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

/** 已知的 admin 子頁面路徑（用來區分 tenant slug） */
const KNOWN_ADMIN_PAGES = new Set([
  'ab', 'ai-settings', 'broadcast', 'crosstab', 'funnel', 'line-settings',
  'notification-rules', 'notification-styles', 'panel', 'rich-menu',
  'site-settings', 'surveys', 'tag-rules', 'tags', 'templates', 'tenants',
  'theme-settings', 'utm', 'utm-links', 'waitlist', 'webhooks', 'responses',
])

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
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 檢查是否為 /admin/{slug}/... 格式（tenant slug 路由）
    if (pathname !== '/admin') {
      const afterAdmin = pathname.slice('/admin/'.length) // e.g. "my-cafe/surveys" or "surveys"
      const firstSegment = afterAdmin.split('/')[0]

      if (firstSegment && !KNOWN_ADMIN_PAGES.has(firstSegment)) {
        // 這是 tenant slug — 驗證是否與 JWT 中的 tenant 一致
        if (firstSegment !== auth.tid) {
          // slug 不匹配 → 導向使用者自己的 tenant
          const correctUrl = pathname.replace(`/admin/${firstSegment}`, `/admin/${auth.tid}`)
          return NextResponse.redirect(new URL(correctUrl, request.url))
        }
        // 移除 slug，rewrite 到實際 admin 頁面
        const rest = afterAdmin.slice(firstSegment.length) // e.g. "/surveys" or ""
        return NextResponse.rewrite(new URL(`/admin${rest}`, request.url), {
          request: { headers: withTenantHeaders(request, auth) },
        })
      }
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
  matcher: ['/admin/:path*', '/admin', '/(admin-\\d{2}-\\d{2})/:path*', '/(admin-\\d{2}-\\d{2})', '/api/admin/:path*', '/login', '/register'],
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type TokenPayload } from '@/lib/jwt'

/** 解析 JWT 認證，回傳 payload 或 null */
async function getAuthContext(request: NextRequest): Promise<TokenPayload | null> {
  const sessionToken = request.cookies.get('admin_session')?.value
  if (sessionToken) {
    const payload = await verifyToken(sessionToken)
    if (payload) return payload
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
  if (pathname === '/login' || pathname === '/register' || pathname === '/super-login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Admin 頁面 /insight-admin/...
  if (pathname.startsWith('/insight-admin')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 檢查是否為 /insight-admin/{slug}/... 格式（tenant slug 路由）
    if (pathname !== '/insight-admin') {
      const afterAdmin = pathname.slice('/insight-admin/'.length) // e.g. "my-cafe/surveys" or "surveys"
      const firstSegment = afterAdmin.split('/')[0]

      if (firstSegment && !KNOWN_ADMIN_PAGES.has(firstSegment)) {
        // 這是 tenant slug — 驗證是否與 JWT 中的 tenant 一致
        if (firstSegment !== auth.tid) {
          // slug 不匹配 → 導向使用者自己的 tenant
          const correctUrl = pathname.replace(`/insight-admin/${firstSegment}`, `/insight-admin/${auth.tid}`)
          return NextResponse.redirect(new URL(correctUrl, request.url))
        }
        // 移除 slug，rewrite 到實際 admin 頁面
        const rest = afterAdmin.slice(firstSegment.length) // e.g. "/surveys" or ""
        return NextResponse.rewrite(new URL(`/insight-admin${rest}`, request.url), {
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

  // Super Admin 控制台 /snowrealm-insight-ctrl/...（僅 super_admin 可存取）
  if (pathname.startsWith('/snowrealm-insight-ctrl')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.redirect(new URL('/super-login', request.url))
    }
    if (auth.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth) },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/insight-admin/:path*', '/insight-admin', '/api/admin/:path*', '/login', '/register', '/snowrealm-insight-ctrl/:path*', '/snowrealm-insight-ctrl'],
}

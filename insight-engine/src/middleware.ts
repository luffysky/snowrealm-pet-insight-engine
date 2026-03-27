import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type TokenPayload } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rateLimit'

/** 解析 JWT 認證，回傳 payload 或 null */
async function getAuthContext(request: NextRequest): Promise<TokenPayload | null> {
  const sessionToken = request.cookies.get('admin_session')?.value
  if (sessionToken) {
    const payload = await verifyToken(sessionToken)
    if (payload) return payload
  }
  return null
}

/** 取得特定 slug 的權限，若無傳入 slug 則回傳預設（第一個）權限 */
function getTenantAccess(auth: TokenPayload, targetSlug?: string): { tid: string; role: string } | null {
  const tenants = (auth.tenants && auth.tenants.length > 0) ? auth.tenants : (auth.tid ? [{ tid: auth.tid, role: auth.role || 'admin' }] : [])
  if (tenants.length === 0) return null
  if (targetSlug) {
    const found = tenants.find(t => t.tid === targetSlug)
    return found || null
  }
  return tenants[0]
}

/** 將 auth payload 注入 request headers，供下游 API/page 讀取 */
function withTenantHeaders(request: NextRequest, auth: TokenPayload, access: { tid: string; role: string }): Headers {
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', access.tid)
  headers.set('x-user-id', auth.sub)
  headers.set('x-user-role', access.role)
  headers.set('x-user-name', encodeURIComponent(auth.name))
  return headers
}

/** 已知的 admin 子頁面路徑（用來區分 tenant slug） */
const KNOWN_ADMIN_PAGES = new Set([
  'ab', 'account', 'ai-settings', 'api-keys', 'broadcast', 'crosstab', 'export', 'funnel', 'insight', 'line-settings',
  'messages', 'my-responses', 'notification-rules', 'notification-styles', 'panel', 'profile', 'rich-menu',
  'site-settings', 'story-wall', 'subscription', 'support', 'survey-templates', 'surveys', 'tag-rules', 'tags', 'team', 'templates', 'tenants',
  'theme-settings', 'utm', 'utm-links', 'upgrade', 'waitlist', 'webhooks', 'responses', 'zcoin',
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

    // 取得預設存取權（以防直接訪問 /insight-admin 沒有給 slug）
    const defaultAccess = getTenantAccess(auth)
    if (!defaultAccess) return NextResponse.redirect(new URL('/login', request.url))

    // 檢查是否為 /insight-admin/{slug}/... 格式（tenant slug 路由）
    if (pathname !== '/insight-admin') {
      const afterAdmin = pathname.slice('/insight-admin/'.length) // e.g. "my-cafe/surveys" or "surveys"
      const firstSegment = afterAdmin.split('/')[0]

      if (firstSegment && !KNOWN_ADMIN_PAGES.has(firstSegment)) {
        // 這是 tenant slug — 驗證使用者是否有該 tenant 的存取權
        const specificAccess = getTenantAccess(auth, firstSegment)
        if (!specificAccess) {
          // slug 不匹配，但用戶有預設權限 → 導向使用者的第一個合法 tenant
          const correctUrl = pathname.replace(`/insight-admin/${firstSegment}`, `/insight-admin/${defaultAccess.tid}`)
          return NextResponse.redirect(new URL(correctUrl, request.url))
        }
        // 移除 slug，rewrite 到實際 admin 頁面
        const rest = afterAdmin.slice(firstSegment.length) // e.g. "/surveys" or ""
        return NextResponse.rewrite(new URL(`/insight-admin${rest}`, request.url), {
          request: { headers: withTenantHeaders(request, auth, specificAccess) },
        })
      }
    }

    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, defaultAccess) },
    })
  }

  // Admin API /api/admin/...
  if (pathname.startsWith('/api/admin')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }
    // Admin API 如果是從特定的 /insight-admin/xxx 呼叫，可能無法從 URL 判斷，目前依賴 HTTP Referer 或是由前端送 headers?
    // 其實 Middleware 無法輕易得知 API 請求是為哪個 slug 打的，除非透過 header 或 query
    // 我們可以從 request.headers 判斷前端嘗試存取哪個 tenantId (如果前端有設參數)
    const targetSlug = request.headers.get('x-request-tenant-id') || undefined
    const access = getTenantAccess(auth, targetSlug)
    if (!access) return NextResponse.json({ error: '未授權或無子帳號權限' }, { status: 403 })

    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, access) },
    })
  }

  // Super Admin 控制台 /snowrealm-insight-ctrl/...（僅 super_admin 可存取）
  if (pathname.startsWith('/snowrealm-insight-ctrl')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.redirect(new URL('/super-login', request.url))
    }
    const tenants = (auth.tenants && auth.tenants.length > 0) ? auth.tenants : (auth.tid ? [{ tid: auth.tid, role: auth.role || 'admin' }] : [])
    const isSuper = tenants.some(t => t.role === 'super_admin') || auth.role === 'super_admin'
    if (!isSuper) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const access = getTenantAccess(auth) ?? { tid: auth.tid ?? 'default', role: 'super_admin' }
    return NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, access) },
    })
  }

  // Super Admin API /api/super-admin/...
  if (pathname.startsWith('/api/super-admin')) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const rl = checkRateLimit(`super-admin:${clientIp}`, 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }
    const tenants = (auth.tenants && auth.tenants.length > 0) ? auth.tenants : (auth.tid ? [{ tid: auth.tid, role: auth.role || 'admin' }] : [])
    const isSuper = tenants.some(t => t.role === 'super_admin') || auth.role === 'super_admin'
    if (!isSuper) {
      return NextResponse.json({ error: '權限不足：僅 super_admin 可存取' }, { status: 403 })
    }
    return NextResponse.next({
      request: {
        headers: (() => {
          const headers = new Headers(request.headers)
          headers.set('x-user-id', auth.sub)
          headers.set('x-user-role', 'super_admin')
          headers.set('x-user-name', encodeURIComponent(auth.name))
          return headers
        })(),
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/insight-admin/:path*', '/insight-admin', '/api/admin/:path*', '/api/super-admin/:path*', '/login', '/register', '/snowrealm-insight-ctrl/:path*', '/snowrealm-insight-ctrl'],
}

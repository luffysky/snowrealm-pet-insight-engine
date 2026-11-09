import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken, type TokenPayload } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rateLimit'

const SESSION_SECONDS = 60 * 60 * 24 * 30   // 30 天
const RENEW_THRESHOLD = 60 * 60 * 24 * 7    // 剩餘不足 7 天時自動續期

/** 如 token 即將過期，在 response 上設定更新後的 cookie */
async function maybeRenewSession(auth: TokenPayload, response: NextResponse): Promise<void> {
  const remaining = auth.exp - Math.floor(Date.now() / 1000)
  if (remaining < RENEW_THRESHOLD) {
    const { exp: _exp, ...rest } = auth
    const newToken = await signToken(rest, SESSION_SECONDS)
    response.cookies.set('admin_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_SECONDS,
      path: '/',
    })
  }
}

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
  'ab', 'account', 'ai-settings', 'api-keys', 'blog', 'blog-stats', 'broadcast', 'crosstab', 'export', 'funnel', 'insight', 'line-settings',
  'messages', 'my-responses', 'notification-rules', 'notification-styles', 'panel', 'profile', 'rich-menu',
  'site-settings', 'social-posts', 'social-reports', 'story-wall', 'subscription', 'support', 'survey-templates', 'surveys', 'tag-rules', 'tags', 'team', 'templates', 'tenants',
  'theme-settings', 'utm', 'utm-links', 'upgrade', 'waitlist', 'webhooks', 'responses', 'zcoin',
])

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // 排程路由一律要 CRON_SECRET；沒設就拒絕，避免任何人都能觸發推播或 AI 任務
  if (pathname.startsWith('/api/cron')) {
    const secret = process.env.CRON_SECRET
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

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
        const res = NextResponse.rewrite(new URL(`/insight-admin${rest}`, request.url), {
          request: { headers: withTenantHeaders(request, auth, specificAccess) },
        })
        await maybeRenewSession(auth, res)
        return res
      }
    }

    const res = NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, defaultAccess) },
    })
    await maybeRenewSession(auth, res)
    return res
  }

  // Admin API /api/admin/...
  if (pathname.startsWith('/api/admin')) {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }
    const targetSlug = request.headers.get('x-request-tenant-id') || undefined
    const access = getTenantAccess(auth, targetSlug)
    if (!access) return NextResponse.json({ error: '未授權或無子帳號權限' }, { status: 403 })

    const res = NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, access) },
    })
    await maybeRenewSession(auth, res)
    return res
  }

  // Public user API /api/zcoin/... /api/ad-view /api/referral — 注入認證但不強制要求
  if (
    pathname.startsWith('/api/zcoin') ||
    pathname.startsWith('/api/ad-view') ||
    pathname.startsWith('/api/referral')
  ) {
    const auth = await getAuthContext(request)
    if (auth) {
      const access = getTenantAccess(auth) ?? { tid: auth.tid ?? 'default', role: auth.role ?? 'viewer' }
      return NextResponse.next({
        request: { headers: withTenantHeaders(request, auth, access) },
      })
    }
    return NextResponse.next()
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
    const res = NextResponse.next({
      request: { headers: withTenantHeaders(request, auth, access) },
    })
    await maybeRenewSession(auth, res)
    return res
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
    // 二進位上傳（貼圖圖片 / ZIP）跳過 header 注入，避免 Next.js 16 body 損毀 bug
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.startsWith('multipart/form-data') || contentType.startsWith('application/octet-stream')) {
      return NextResponse.next()
    }
    const superRes = NextResponse.next({
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
    await maybeRenewSession(auth, superRes)
    return superRes
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/cron/:path*',
    '/insight-admin/:path*',
    '/insight-admin',
    '/api/admin/:path*',
    '/api/super-admin/:path*',
    '/api/zcoin/:path*',
    '/api/zcoin',
    '/api/ad-view',
    '/api/ad-view/:path*',
    '/api/referral',
    '/api/referral/:path*',
    '/login',
    '/register',
    '/snowrealm-insight-ctrl/:path*',
    '/snowrealm-insight-ctrl',
  ],
}

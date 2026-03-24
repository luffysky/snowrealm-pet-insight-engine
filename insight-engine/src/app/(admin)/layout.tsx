'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AdminSurveyProvider, useAdminSurvey, ADMIN_THEME_COLORS, THEME_CSS_VALUES } from '@/components/admin/AdminSurveyContext'
import dynamic from 'next/dynamic'

const AdminBackground3D = dynamic(() => import('@/components/admin/AdminBackground3D'), { ssr: false })

interface UserInfo {
  userId: string
  role: string
  tenantId: string
  userName: string
  tenantName?: string
  adminTitle?: string
  tenants?: { slug: string; name: string }[]
  platformPartner?: boolean
}

/** 已知的 admin 子頁面路徑（與 middleware 保持一致，用來區分 tenant slug） */
const KNOWN_ADMIN_PAGES = new Set([
  'ab', 'account', 'ai-settings', 'broadcast', 'crosstab', 'export', 'funnel', 'insight', 'line-settings',
  'my-responses', 'notification-rules', 'notification-styles', 'panel', 'rich-menu',
  'site-settings', 'story-wall', 'subscription', 'support', 'surveys', 'tag-rules', 'tags', 'team', 'templates', 'tenants',
  'theme-settings', 'utm', 'utm-links', 'waitlist', 'webhooks', 'responses',
])

/** 從 pathname 提取 tenant slug（如 /insight-admin/snowrealm-pet/surveys → snowrealm-pet） */
function extractSlug(pathname: string): string | null {
  if (!pathname.startsWith('/insight-admin/')) return null
  const firstSegment = pathname.slice('/insight-admin/'.length).split('/')[0]
  if (firstSegment && !KNOWN_ADMIN_PAGES.has(firstSegment)) return firstSegment
  return null
}

// 基礎導航路徑定義（不含 slug，slug 由 render 時動態加入）
const BASE_NAV_ITEMS = [
  { path: '', label: 'Dashboard' },
  { path: '/surveys', label: '問卷管理' },
  { path: '/responses', label: '填答列表' },
  { path: '/funnel', label: '漏斗分析' },
  { path: '/crosstab', label: '交叉分析' },
  { path: '/tags', label: '標籤統計' },
  { path: '/tag-rules', label: '標籤規則' },
  { path: '/utm', label: '來源分析' },
  { path: '/ab', label: 'A/B 比較' },
  { path: '/webhooks', label: 'Webhook' },
  { path: '/panel', label: '管理員面板' },
  { path: '/broadcast', label: 'LINE 推播' },
  { path: '/notification-rules', label: '通知規則' },
  { path: '/templates', label: '訊息模板' },
  { path: '/utm-links', label: 'UTM 管理' },
  { path: '/rich-menu', label: 'Rich Menu' },
  { path: '/line-settings', label: 'LINE 設定' },
  { path: '/notification-styles', label: '通知樣式' },
  { path: '/waitlist', label: '封測名單' },
  { path: '/site-settings', label: 'Meta / OG' },
]

const BASE_DIRECT = [
  { path: '', label: 'Dashboard' },
  { path: '/surveys', label: '問卷管理' },
]

const BASE_NAV_GROUPS = [
  {
    label: '📊 數據分析',
    items: [
      { path: '/responses', label: '填答列表' },
      { path: '/funnel', label: '漏斗分析' },
      { path: '/crosstab', label: '交叉分析' },
      { path: '/tags', label: '標籤統計' },
      { path: '/tag-rules', label: '標籤規則' },
      { path: '/utm', label: '來源分析' },
      { path: '/ab', label: 'A/B 比較' },
      { path: '/insight', label: '🔍 AI 洞察報告' },
      { path: '/story-wall', label: '📖 故事牆管理' },
    ],
  },
  {
    label: '📬 客服',
    items: [
      { path: '/support', label: '客服中心' },
    ],
  },
  {
    label: '💬 LINE',
    items: [
      { path: '/line-settings', label: 'LINE 設定' },
      { path: '/broadcast', label: 'LINE 推播' },
      { path: '/notification-rules', label: '通知規則' },
      { path: '/templates', label: '訊息模板' },
      { path: '/rich-menu', label: 'Rich Menu' },
      { path: '/notification-styles', label: '通知樣式' },
    ],
  },
  {
    label: '⚙️ 系統',
    items: [
      { path: '/panel', label: '管理員面板' },
      { path: '/ai-settings', label: 'AI 設定' },
      { path: '/theme-settings', label: '主題設定' },
      { path: '/site-settings', label: 'Meta / OG' },
      { path: '/utm-links', label: 'UTM 管理' },
      { path: '/webhooks', label: 'Webhook' },
      { path: '/waitlist', label: '封測名單' },
      { path: '/team', label: '團隊管理' },
      { path: '/subscription', label: '訂閱管理' },
      { path: '/account', label: '帳號設定' },
      { path: '/my-responses', label: '我的填答' },
    ],
  },
]

const BASE_MOBILE_GROUPS = [
  {
    title: '總覽',
    items: [
      { path: '', label: 'Dashboard' },
      { path: '/surveys', label: '問卷管理' },
    ],
  },
  {
    title: '數據分析',
    items: [
      { path: '/responses', label: '填答列表' },
      { path: '/funnel', label: '漏斗分析' },
      { path: '/crosstab', label: '交叉分析' },
      { path: '/tags', label: '標籤統計' },
      { path: '/tag-rules', label: '標籤規則' },
      { path: '/utm', label: '來源分析' },
      { path: '/ab', label: 'A/B 比較' },
      { path: '/insight', label: 'AI 洞察報告' },
      { path: '/story-wall', label: '故事牆管理' },
    ],
  },
  {
    title: '客服',
    items: [
      { path: '/support', label: '客服中心' },
    ],
  },
  {
    title: 'LINE',
    items: [
      { path: '/line-settings', label: 'LINE 設定' },
      { path: '/broadcast', label: 'LINE 推播' },
      { path: '/notification-rules', label: '通知規則' },
      { path: '/templates', label: '訊息模板' },
      { path: '/rich-menu', label: 'Rich Menu' },
      { path: '/notification-styles', label: '通知樣式' },
    ],
  },
  {
    title: '系統',
    items: [
      { path: '/panel', label: '管理員面板' },
      { path: '/ai-settings', label: 'AI 設定' },
      { path: '/theme-settings', label: '主題設定' },
      { path: '/site-settings', label: 'Meta / OG' },
      { path: '/utm-links', label: 'UTM 管理' },
      { path: '/webhooks', label: 'Webhook' },
      { path: '/waitlist', label: '封測名單' },
      { path: '/team', label: '團隊管理' },
      { path: '/subscription', label: '訂閱管理' },
      { path: '/account', label: '帳號設定' },
      { path: '/my-responses', label: '我的填答' },
    ],
  },
]

/** 將 base path 加上 admin prefix（含 slug） */
function toHref(basePath: string, adminPrefix: string): string {
  return `${adminPrefix}${basePath}`
}

interface NavItem { href: string; label: string }
interface NavGroup { label: string; items: NavItem[] }

function NavDropdown({ group, pathname, themeColors }: { group: NavGroup; pathname: string; themeColors: any }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const hasActive = group.items.some((i) => pathname === i.href)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
          hasActive ? `${themeColors.accent} font-medium` : 'text-slate-400 hover:text-white'
        }`}
      >
        {group.label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? `${themeColors.accent} ${themeColors.accentBg} font-medium`
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSurveyProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSurveyProvider>
  )
}

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const { surveys, selectedSurveyId, selectedSurvey, theme, setSelectedSurveyId } = useAdminSurvey()
  const tc = ADMIN_THEME_COLORS[theme]
  const cssVars = THEME_CSS_VALUES[theme] as React.CSSProperties
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tenantDropOpen, setTenantDropOpen] = useState(false)
  const tenantRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const slug = extractSlug(pathname) ?? user?.tenantId ?? null
  const adminPrefix = slug ? `/insight-admin/${slug}` : '/insight-admin'

  const directItems = useMemo(() =>
    BASE_DIRECT.map(i => ({ href: toHref(i.path, adminPrefix), label: i.label })),
    [adminPrefix]
  )

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) setTenantDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleSwitchTenant = async (tenantSlug: string) => {
    const res = await fetch('/api/auth/switch-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenantSlug }),
    })
    if (res.ok) {
      setTenantDropOpen(false)
      window.location.href = `/insight-admin/${tenantSlug}`
    }
  }

  const displayRole = user?.role === 'super_admin' ? 'admin' : user?.role

  const resolvedNavGroups = useMemo(() =>
    BASE_NAV_GROUPS.map(g => ({
      label: g.label,
      items: g.items.map(i => ({ href: toHref(i.path, adminPrefix), label: i.label })),
    })),
    [adminPrefix]
  )

  const resolvedMobileGroups = useMemo(() =>
    BASE_MOBILE_GROUPS.map(g => ({
      title: g.title,
      items: g.items.map(i => ({ href: toHref(i.path, adminPrefix), label: i.label })),
    })),
    [adminPrefix]
  )

  const systemItems: NavItem[] = useMemo(() => [
    { href: toHref('/panel', adminPrefix), label: '管理員面板' },
    { href: toHref('/ai-settings', adminPrefix), label: 'AI 設定' },
    { href: toHref('/theme-settings', adminPrefix), label: '主題設定' },
    { href: toHref('/site-settings', adminPrefix), label: 'Meta / OG' },
    { href: toHref('/utm-links', adminPrefix), label: 'UTM 管理' },
    { href: toHref('/webhooks', adminPrefix), label: 'Webhook' },
    { href: toHref('/waitlist', adminPrefix), label: '封測名單' },
    { href: toHref('/team', adminPrefix), label: '團隊管理' },
    { href: toHref('/subscription', adminPrefix), label: '訂閱管理' },
    { href: toHref('/export', adminPrefix), label: '資料匯出' },
    { href: toHref('/account', adminPrefix), label: '後台設定' },
    { href: toHref('/my-responses', adminPrefix), label: '我的填答' },
  ], [adminPrefix])

  const dynamicGroups: NavGroup[] = useMemo(() => [
    resolvedNavGroups[0],
    resolvedNavGroups[1],
    resolvedNavGroups[2],
    { label: '⚙️ 系統', items: systemItems },
  ], [resolvedNavGroups, systemItems])

  const dynamicMobileGroups = useMemo(() => [
    resolvedMobileGroups[0],
    resolvedMobileGroups[1],
    resolvedMobileGroups[2],
    resolvedMobileGroups[3],
    { title: '系統', items: systemItems },
  ], [resolvedMobileGroups, systemItems])

  return (
    <div className={`min-h-screen ${tc.bodyBg} transition-colors duration-300`} style={cssVars} data-admin-theme={theme}>
      <nav className={`border-b ${tc.navBorder} ${tc.navBg} backdrop-blur-sm sticky top-0 z-50 ${tc.headerGlow}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={adminPrefix}
              className="text-lg font-bold text-white/90"
            >
              {user?.adminTitle || '管理後台'}
            </Link>
            {user?.platformPartner && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                🌟 平台禮遇
              </span>
            )}
          </div>

          {/* Desktop nav — 直連 + 分組下拉 */}
          <div className="hidden lg:flex items-center gap-5 text-sm ml-8">
            {directItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? `${tc.accent} font-medium`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {dynamicGroups.map((group) => (
              <NavDropdown key={group.label} group={group} pathname={pathname} themeColors={tc} />
            ))}
          </div>

          {/* User info + tenant switcher + logout */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            {user && user.tenants && user.tenants.length > 1 && (
              <div className="relative" ref={tenantRef}>
                <button
                  onClick={() => setTenantDropOpen(!tenantDropOpen)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <span className="text-slate-500">🏢</span>
                  <span>{user.tenantName ?? user.tenantId}</span>
                  <svg className={`w-3 h-3 transition-transform ${tenantDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tenantDropOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                    {user.tenants.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => handleSwitchTenant(t.slug)}
                        className={`block w-full text-left px-4 py-2 text-sm cursor-pointer ${
                          t.slug === user.tenantId
                            ? `${tc.accent} ${tc.accentBg}`
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{user.userName}</span>
                <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">{displayRole}</span>
                {user.platformPartner && (
                  <span className="text-[10px] text-amber-400">🌟</span>
                )}
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">登出</button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-slate-400 hover:text-white p-2 cursor-pointer"
            aria-label="選單"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Survey Selector Bar */}
        {surveys.length > 0 && (
          <div className={`border-t ${tc.navBorder} ${tc.bodyBg}/60`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">問卷:</span>
              <select
                value={selectedSurveyId ?? ''}
                onChange={(e) => setSelectedSurveyId(e.target.value || null)}
                className={`bg-slate-800 border ${tc.accentBorder} ${tc.accent} rounded-lg px-3 py-1.5 text-sm max-w-xs truncate cursor-pointer`}
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}{s.is_primary ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
              {selectedSurvey && (
                <span className="text-xs text-slate-600 hidden sm:inline font-mono">{selectedSurvey.slug}</span>
              )}
            </div>
          </div>
        )}

        {/* Mobile menu — 分組顯示 */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm max-h-[75vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
              {dynamicMobileGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          pathname === item.href
                            ? `${tc.accentBg} ${tc.accent} font-medium`
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {/* Mobile user info */}
              {user && (
                <div className="border-t border-slate-800 pt-3 flex flex-col gap-2 relative pb-3">
                  {user.tenants && user.tenants.length > 1 && (
                    <div className="px-3">
                      <select
                        value={user.tenantId}
                        onChange={(e) => handleSwitchTenant(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {user.tenants.map(t => (
                          <option key={t.slug} value={t.slug}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="px-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {user.userName} <span className="text-slate-600">({displayRole})</span>
                      {(!user.tenants || user.tenants.length <= 1) && user.tenantName && (
                        <span className="ml-2 text-slate-600">• {user.tenantName}</span>
                      )}
                    </div>
                    <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">登出</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <AdminBackground3D />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { AdminSurveyProvider, useAdminSurvey, ADMIN_THEME_COLORS } from '@/components/admin/AdminSurveyContext'

interface UserInfo {
  userId: string
  role: string
  tenantId: string
  userName: string
  tenantName?: string
  tenants?: { slug: string; name: string }[]
}

// 所有導航項（供 mobile menu 使用）
const ALL_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/surveys', label: '問卷管理' },
  { href: '/admin/responses', label: '填答列表' },
  { href: '/admin/funnel', label: '漏斗分析' },
  { href: '/admin/crosstab', label: '交叉分析' },
  { href: '/admin/tags', label: '標籤統計' },
  { href: '/admin/tag-rules', label: '標籤規則' },
  { href: '/admin/utm', label: '來源分析' },
  { href: '/admin/ab', label: 'A/B 比較' },
  { href: '/admin/webhooks', label: 'Webhook' },
  { href: '/admin/panel', label: '管理員面板' },
  { href: '/admin/broadcast', label: 'LINE 推播' },
  { href: '/admin/notification-rules', label: '通知規則' },
  { href: '/admin/templates', label: '訊息模板' },
  { href: '/admin/utm-links', label: 'UTM 管理' },
  { href: '/admin/rich-menu', label: 'Rich Menu' },
  { href: '/admin/line-settings', label: 'LINE 設定' },
  { href: '/admin/notification-styles', label: '通知樣式' },
  { href: '/admin/waitlist', label: '封測名單' },
  { href: '/admin/site-settings', label: 'Meta / OG' },
]

// Desktop 分組下拉
interface NavGroup {
  label: string
  items: { href: string; label: string }[]
}

const DIRECT_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/surveys', label: '問卷管理' },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: '📊 數據分析',
    items: [
      { href: '/admin/responses', label: '填答列表' },
      { href: '/admin/funnel', label: '漏斗分析' },
      { href: '/admin/crosstab', label: '交叉分析' },
      { href: '/admin/tags', label: '標籤統計' },
      { href: '/admin/tag-rules', label: '標籤規則' },
      { href: '/admin/utm', label: '來源分析' },
      { href: '/admin/ab', label: 'A/B 比較' },
    ],
  },
  {
    label: '💬 LINE',
    items: [
      { href: '/admin/broadcast', label: 'LINE 推播' },
      { href: '/admin/notification-rules', label: '通知規則' },
      { href: '/admin/templates', label: '訊息模板' },
      { href: '/admin/rich-menu', label: 'Rich Menu' },
      { href: '/admin/line-settings', label: 'LINE 設定' },
      { href: '/admin/notification-styles', label: '通知樣式' },
    ],
  },
  {
    label: '⚙️ 系統',
    items: [
      { href: '/admin/panel', label: '管理員面板' },
      { href: '/admin/ai-settings', label: 'AI 設定' },
      { href: '/admin/theme-settings', label: '主題設定' },
      { href: '/admin/site-settings', label: 'Meta / OG' },
      { href: '/admin/utm-links', label: 'UTM 管理' },
      { href: '/admin/webhooks', label: 'Webhook' },
      { href: '/admin/waitlist', label: '封測名單' },
    ],
  },
]

// Mobile 分組（含 icon）
const MOBILE_GROUPS = [
  {
    title: '總覽',
    items: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/surveys', label: '問卷管理' },
    ],
  },
  {
    title: '數據分析',
    items: [
      { href: '/admin/responses', label: '填答列表' },
      { href: '/admin/funnel', label: '漏斗分析' },
      { href: '/admin/crosstab', label: '交叉分析' },
      { href: '/admin/tags', label: '標籤統計' },
      { href: '/admin/tag-rules', label: '標籤規則' },
      { href: '/admin/utm', label: '來源分析' },
      { href: '/admin/ab', label: 'A/B 比較' },
    ],
  },
  {
    title: 'LINE',
    items: [
      { href: '/admin/broadcast', label: 'LINE 推播' },
      { href: '/admin/notification-rules', label: '通知規則' },
      { href: '/admin/templates', label: '訊息模板' },
      { href: '/admin/rich-menu', label: 'Rich Menu' },
      { href: '/admin/line-settings', label: 'LINE 設定' },
      { href: '/admin/notification-styles', label: '通知樣式' },
    ],
  },
  {
    title: '系統',
    items: [
      { href: '/admin/panel', label: '管理員面板' },
      { href: '/admin/ai-settings', label: 'AI 設定' },
      { href: '/admin/theme-settings', label: '主題設定' },
      { href: '/admin/site-settings', label: 'Meta / OG' },
      { href: '/admin/utm-links', label: 'UTM 管理' },
      { href: '/admin/webhooks', label: 'Webhook' },
      { href: '/admin/waitlist', label: '封測名單' },
    ],
  },
]

function NavDropdown({ group, pathname, themeColors }: { group: NavGroup; pathname: string; themeColors: typeof ADMIN_THEME_COLORS['default'] }) {
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tenantDropOpen, setTenantDropOpen] = useState(false)
  const tenantRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

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
      window.location.reload()
    }
  }

  const isSuperAdmin = user?.role === 'super_admin'

  // Dynamic nav groups — super_admin sees tenant management
  const systemItems = [
    { href: '/admin/panel', label: '管理員面板' },
    { href: '/admin/ai-settings', label: 'AI 設定' },
    { href: '/admin/theme-settings', label: '主題設定' },
    { href: '/admin/utm-links', label: 'UTM 管理' },
    { href: '/admin/webhooks', label: 'Webhook' },
    { href: '/admin/waitlist', label: '封測名單' },
    ...(isSuperAdmin ? [{ href: '/admin/tenants', label: '租戶管理' }] : []),
  ]

  const dynamicGroups: NavGroup[] = [
    NAV_GROUPS[0], // 數據分析
    NAV_GROUPS[1], // LINE
    { label: '⚙️ 系統', items: systemItems },
  ]

  const dynamicMobileGroups = [
    MOBILE_GROUPS[0], // 總覽
    MOBILE_GROUPS[1], // 數據分析
    MOBILE_GROUPS[2], // LINE
    {
      title: '系統',
      items: systemItems,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className={`border-b ${tc.navBorder} ${tc.navBg} backdrop-blur-sm sticky top-0 z-50 ${tc.headerGlow}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-lg font-bold text-white/90 shrink-0"
          >
            🐾 毛行天下後台
          </Link>

          {/* Desktop nav — 直連 + 分組下拉 */}
          <div className="hidden lg:flex items-center gap-5 text-sm ml-8">
            {DIRECT_ITEMS.map((item) => (
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
            {user && isSuperAdmin && user.tenants && user.tenants.length > 1 && (
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
                <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">{user.role}</span>
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
          <div className={`border-t ${tc.navBorder} bg-slate-950/60`}>
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
                <div className="border-t border-slate-800 pt-3 px-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {user.userName} <span className="text-slate-600">({user.role})</span>
                    {user.tenantName && <span className="ml-2 text-slate-600">• {user.tenantName}</span>}
                  </div>
                  <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">登出</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}

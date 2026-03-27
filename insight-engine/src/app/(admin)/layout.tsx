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

const KNOWN_ADMIN_PAGES = new Set([
  'ab', 'account', 'ai-settings', 'api-keys', 'broadcast', 'crosstab', 'export', 'funnel', 'insight', 'line-settings',
  'messages', 'my-responses', 'notification-rules', 'notification-styles', 'panel', 'profile', 'rich-menu',
  'site-settings', 'story-wall', 'subscription', 'support', 'survey-templates', 'surveys', 'tag-rules', 'tags', 'team', 'templates', 'tenants',
  'theme-settings', 'utm', 'utm-links', 'upgrade', 'waitlist', 'webhooks', 'responses', 'zcoin',
])

function extractSlug(pathname: string): string | null {
  if (!pathname.startsWith('/insight-admin/')) return null
  const firstSegment = pathname.slice('/insight-admin/'.length).split('/')[0]
  if (firstSegment && !KNOWN_ADMIN_PAGES.has(firstSegment)) return firstSegment
  return null
}

function toHref(basePath: string, adminPrefix: string): string {
  return `${adminPrefix}${basePath}`
}

// 導航群組定義
const NAV_GROUPS = [
  {
    label: '核心',
    items: [
      { path: '', label: 'Dashboard', icon: '🏠' },
      { path: '/surveys', label: '問卷管理', icon: '📋' },
      { path: '/survey-templates', label: '模板庫', icon: '📑' },
      { path: '/responses', label: '填答列表', icon: '📝' },
    ],
  },
  {
    label: '數據分析',
    items: [
      { path: '/funnel', label: '漏斗分析', icon: '🔻' },
      { path: '/crosstab', label: '交叉分析', icon: '📊' },
      { path: '/tags', label: '標籤統計', icon: '🏷️' },
      { path: '/tag-rules', label: '標籤規則', icon: '⚙️' },
      { path: '/utm', label: '來源分析', icon: '📡' },
      { path: '/ab', label: 'A/B 比較', icon: '⚖️' },
      { path: '/insight', label: 'AI 洞察報告', icon: '🔍' },
      { path: '/story-wall', label: '故事牆管理', icon: '📖' },
    ],
  },
  {
    label: '社群',
    items: [
      { path: '/profile', label: '個人頁面', icon: '👤' },
      { path: '/messages', label: '私訊', icon: '💬' },
      { path: '/support', label: '客服中心', icon: '📬' },
    ],
  },
  {
    label: 'LINE',
    items: [
      { path: '/line-settings', label: 'LINE 設定', icon: '💬' },
      { path: '/broadcast', label: 'LINE 推播', icon: '📢' },
      { path: '/notification-rules', label: '通知規則', icon: '🔔' },
      { path: '/templates', label: '訊息模板', icon: '✉️' },
      { path: '/rich-menu', label: 'Rich Menu', icon: '📱' },
      { path: '/notification-styles', label: '通知樣式', icon: '🎨' },
    ],
  },
  {
    label: '系統',
    items: [
      { path: '/panel', label: '管理員面板', icon: '🖥️' },
      { path: '/ai-settings', label: 'AI 設定', icon: '🤖' },
      { path: '/theme-settings', label: '主題設定', icon: '🎨' },
      { path: '/site-settings', label: 'Meta / OG', icon: '🌐' },
      { path: '/utm-links', label: 'UTM 管理', icon: '🔗' },
      { path: '/webhooks', label: 'Webhook', icon: '🪝' },
      { path: '/waitlist', label: '封測名單', icon: '📋' },
      { path: '/team', label: '團隊管理', icon: '👥' },
      { path: '/zcoin', label: 'Z幣管理', icon: '🪙' },
      { path: '/subscription', label: '訂閱管理', icon: '💳' },
      { path: '/upgrade', label: '升級方案', icon: '🚀' },
      { path: '/account', label: '帳號設定', icon: '⚙️' },
      { path: '/my-responses', label: '我的填答', icon: '📄' },
    ],
  },
]

function SidebarGroup({
  label,
  items,
  pathname,
  adminPrefix,
  accent,
  accentBg,
  defaultOpen = true,
  collapsed = false,
}: {
  label: string
  items: { path: string; label: string; icon: string }[]
  pathname: string
  adminPrefix: string
  accent: string
  accentBg: string
  defaultOpen?: boolean
  collapsed?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasActive = items.some(i => {
    const href = toHref(i.path, adminPrefix)
    return i.path === '' ? pathname === adminPrefix : pathname.startsWith(href)
  })

  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  // Collapsed mode: show only icons, no labels or group headers
  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map(item => {
          const href = toHref(item.path, adminPrefix)
          const isActive = item.path === '' ? pathname === adminPrefix : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors ${
                isActive ? `${accentBg} ${accent}` : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors"
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {items.map(item => {
            const href = toHref(item.path, adminPrefix)
            const isActive = item.path === '' ? pathname === adminPrefix : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? `${accentBg} ${accent} font-medium`
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSurveyProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSurveyProvider>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { surveys, selectedSurveyId, selectedSurvey, theme, setSelectedSurveyId } = useAdminSurvey()
  const tc = ADMIN_THEME_COLORS[theme]
  const cssVars = THEME_CSS_VALUES[theme] as React.CSSProperties
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const slug = extractSlug(pathname) ?? user?.tenantId ?? null
  const adminPrefix = slug ? `/insight-admin/${slug}` : '/insight-admin'

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) setUser(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

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
    if (res.ok) window.location.href = `/insight-admin/${tenantSlug}`
  }

  const displayRole = user?.role === 'super_admin' ? 'super' : user?.role

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + title + collapse toggle */}
      <div className="px-4 py-4 border-b border-white/8 flex items-center justify-between">
        <Link href={adminPrefix} className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">✦</span>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-white/90 truncate">
              {user?.adminTitle || 'Insight Engine'}
            </span>
          )}
        </Link>
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-white/8 hover:bg-white/16 border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all shrink-0"
          title={sidebarCollapsed ? '展開側邊欄' : '收合側邊欄'}
        >
          {sidebarCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Platform partner badge */}
      {!sidebarCollapsed && user?.platformPartner && (
        <div className="px-4 pt-2">
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            🌟 平台禮遇
          </span>
        </div>
      )}

      {/* 問卷選擇器 */}
      {!sidebarCollapsed && surveys.length > 0 && (
        <div className="px-3 py-3 border-b border-white/8">
          <p className="text-xs text-slate-500 mb-1.5">當前問卷</p>
          <select
            value={selectedSurveyId ?? ''}
            onChange={e => setSelectedSurveyId(e.target.value || null)}
            className={`glass-input w-full ${tc.accentBorder} ${tc.accent} rounded-lg px-2.5 py-1.5 text-xs truncate cursor-pointer`}
          >
            {surveys.map(s => (
              <option key={s.id} value={s.id} className="bg-slate-900">
                {s.title}{s.is_primary ? ' ⭐' : ''}
              </option>
            ))}
          </select>
          {selectedSurvey && (
            <p className="text-[10px] text-slate-600 mt-1 font-mono truncate">{selectedSurvey.slug}</p>
          )}
        </div>
      )}

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {NAV_GROUPS.map((group, i) => (
          <SidebarGroup
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
            adminPrefix={adminPrefix}
            accent={tc.accent}
            accentBg={tc.accentBg}
            defaultOpen={i < 3}
            collapsed={sidebarCollapsed}
          />
        ))}
      </div>

      {/* User info + logout */}
      {!sidebarCollapsed && (
        <div className="border-t border-white/8 px-3 py-3 space-y-2">
          {user?.tenants && user.tenants.length > 1 && (
            <select
              value={user.tenantId}
              onChange={e => handleSwitchTenant(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer focus:outline-none"
            >
              {user.tenants.map(t => (
                <option key={t.slug} value={t.slug} className="bg-slate-900">{t.name}</option>
              ))}
            </select>
          )}
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-slate-300 truncate">{user.userName}</p>
                <p className="text-[10px] text-slate-500">{displayRole} · {user.tenantName ?? user.tenantId}</p>
              </div>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0 ml-2">
                登出
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className={`min-h-screen ${tc.bodyBg} transition-colors duration-300`} style={cssVars} data-admin-theme={theme}>
      <AdminBackground3D />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50
        glass-sidebar
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${sidebarCollapsed ? 'w-14' : 'w-60'}
      `}>
        {SidebarContent}
      </aside>

      {/* Main content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-14' : 'lg:pl-60'}`}>
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-950/60 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 hover:bg-white/16 border border-white/15 hover:border-white/30 text-white/70 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white/80 truncate">
            {user?.adminTitle || 'Insight Engine'}
          </span>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}

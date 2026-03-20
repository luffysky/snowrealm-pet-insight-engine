'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

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
  { href: '/admin/broadcast', label: 'LINE 推播' },
  { href: '/admin/notification-rules', label: '通知規則' },
  { href: '/admin/templates', label: '訊息模板' },
  { href: '/admin/utm-links', label: 'UTM 管理' },
  { href: '/admin/rich-menu', label: 'Rich Menu' },
  { href: '/admin/line-settings', label: 'LINE 設定' },
  { href: '/admin/notification-styles', label: '通知樣式' },
  { href: '/admin/waitlist', label: '封測名單' },
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
      { href: '/admin/ai-settings', label: 'AI 設定' },
      { href: '/admin/theme-settings', label: '主題設定' },
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
      { href: '/admin/ai-settings', label: 'AI 設定' },
      { href: '/admin/theme-settings', label: '主題設定' },
      { href: '/admin/utm-links', label: 'UTM 管理' },
      { href: '/admin/webhooks', label: 'Webhook' },
      { href: '/admin/waitlist', label: '封測名單' },
    ],
  },
]

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
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
          hasActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-white'
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
                  ? 'text-cyan-400 bg-cyan-500/10 font-medium'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
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
                    ? 'text-cyan-400 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {NAV_GROUPS.map((group) => (
              <NavDropdown key={group.label} group={group} pathname={pathname} />
            ))}
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

        {/* Mobile menu — 分組顯示 */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm max-h-[75vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
              {MOBILE_GROUPS.map((group) => (
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
                            ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}

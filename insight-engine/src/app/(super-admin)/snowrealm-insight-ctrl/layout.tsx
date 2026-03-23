'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** 營運／內容（與「系統監控」分組，避免窄螢幕時以為總後台沒更新） */
const NAV_OPERATIONS = [
  { href: '/snowrealm-insight-ctrl', label: '總覽', icon: '📊' },
  { href: '/snowrealm-insight-ctrl/tenants', label: '租戶管理', icon: '🏢' },
  { href: '/snowrealm-insight-ctrl/users', label: '使用者', icon: '👤' },
  { href: '/snowrealm-insight-ctrl/usage', label: '用量追蹤', icon: '📈' },
  { href: '/snowrealm-insight-ctrl/support', label: '客服工單', icon: '📬' },
  { href: '/snowrealm-insight-ctrl/site-settings', label: '首頁 SEO', icon: '🌐' },
  { href: '/snowrealm-insight-ctrl/plans', label: '收費規劃', icon: '💰' },
]

const NAV_SYSTEM = [
  { href: '/snowrealm-insight-ctrl/audit', label: '操作審計', icon: '📋' },
  { href: '/snowrealm-insight-ctrl/health', label: '系統健康', icon: '🏥' },
  { href: '/snowrealm-insight-ctrl/analytics', label: '分析儀表板', icon: '📉' },
]

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/super-login'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center justify-between gap-3 lg:contents">
            <span className="text-lg font-bold text-amber-400 shrink-0">⚡ SIE 系統控制台</span>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-slate-400 hover:text-white p-2 cursor-pointer shrink-0"
              aria-label="開啟選單"
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

          <div className="hidden md:flex flex-col items-end gap-2 text-sm min-w-0 flex-1">
            <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0 mr-1">營運</span>
              {NAV_OPERATIONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap transition-colors ${
                    pathname === item.href
                      ? 'text-amber-400 font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-2 border-t border-slate-800/80 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0 mr-1">監控</span>
              {NAV_SYSTEM.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap transition-colors ${
                    pathname === item.href
                      ? 'text-cyan-400 font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap ml-1"
              >
                登出
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3">營運</p>
              {NAV_OPERATIONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-amber-400/10 text-amber-400 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
              <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 pt-2 border-t border-slate-800">監控</p>
              {NAV_SYSTEM.map((item) => (
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
                  {item.icon} {item.label}
                </Link>
              ))}
              <div className="border-t border-slate-800 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  🚪 登出
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}

'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/snowrealm-insight-ctrl', label: '總覽', icon: '📊' },
  { href: '/snowrealm-insight-ctrl/tenants', label: '租戶管理', icon: '🏢' },
  { href: '/snowrealm-insight-ctrl/users', label: '使用者', icon: '👤' },
  { href: '/snowrealm-insight-ctrl/usage', label: '用量追蹤', icon: '📈' },
  { href: '/snowrealm-insight-ctrl/site-settings', label: '首頁 SEO', icon: '🌐' },
  { href: '/snowrealm-insight-ctrl/plans', label: '收費規劃', icon: '💰' },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-amber-400 shrink-0">⚡ SIE 系統控制台</span>
          
          <div className="hidden md:flex items-center gap-4 text-sm overflow-x-auto">
            {NAV_ITEMS.map((item) => (
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
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors ml-4 cursor-pointer"
            >
              登出
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-2 cursor-pointer"
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

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
            <div className="px-4 py-3 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
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

'use client'

import { ReactNode } from 'react'
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
          <span className="text-lg font-bold text-amber-400 shrink-0">⚡ SIE 系統控制台</span>
          <div className="flex items-center gap-4 text-sm overflow-x-auto">
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
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}

'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SuperAdminBg, SA_THEMES, type SuperAdminTheme } from '@/components/super-admin/SuperAdminBg'
import { LayoutDashboard, Building2, Users, BarChart3, Shield, Headphones, Bell, Smartphone, Palette, Globe, DollarSign, Sticker, ClipboardList, HeartPulse, TrendingDown, LogOut, Menu, ChevronRight, Sparkles, ShoppingBag, Bot, ShieldAlert, FileWarning, CreditCard, BrainCircuit, Radio, MessageSquare, FolderOpen } from 'lucide-react'

const NAV_ITEMS = [
  { group: '營運管理', items: [
    { href: '/snowrealm-insight-ctrl',               label: '總覽儀表板',  icon: LayoutDashboard },
    { href: '/snowrealm-insight-ctrl/tenants',       label: '租戶管理',   icon: Building2 },
    { href: '/snowrealm-insight-ctrl/users',         label: '使用者',     icon: Users },
    { href: '/snowrealm-insight-ctrl/usage',         label: '用量追蹤',   icon: BarChart3 },
    { href: '/snowrealm-insight-ctrl/plans',         label: '收費規劃',   icon: DollarSign },
  ]},
  { group: '安全監控', items: [
    { href: '/snowrealm-insight-ctrl/security',      label: '安全總覽',   icon: ShieldAlert },
    { href: '/snowrealm-insight-ctrl/moderation',    label: '內容審核',   icon: FileWarning },
  ]},
  { group: '社群系統', items: [
    { href: '/snowrealm-insight-ctrl/social',        label: '社群監控',   icon: Shield },
    { href: '/snowrealm-insight-ctrl/support',       label: '客服工單',   icon: Headphones },
    { href: '/snowrealm-insight-ctrl/stickers',      label: '貼圖管理',   icon: Sticker },
    { href: '/snowrealm-insight-ctrl/marketplace',   label: '市集管理',   icon: ShoppingBag },
  ]},
  { group: '財務', items: [
    { href: '/snowrealm-insight-ctrl/orders',        label: '金流訂單',   icon: CreditCard },
    { href: '/snowrealm-insight-ctrl/ai-cost',       label: 'AI 成本',    icon: BrainCircuit },
  ]},
  { group: '即時監控', items: [
    { href: '/snowrealm-insight-ctrl/live-feed',     label: '即時活動流', icon: Radio },
    { href: '/snowrealm-insight-ctrl/conversations', label: 'AI 對話記錄', icon: MessageSquare },
    { href: '/snowrealm-insight-ctrl/files',         label: '檔案管理',   icon: FolderOpen },
  ]},
  { group: '平台推播', items: [
    { href: '/snowrealm-insight-ctrl/notifications', label: '平台通知',   icon: Bell },
    { href: '/snowrealm-insight-ctrl/rich-menu',     label: 'Rich Menu', icon: Smartphone },
    { href: '/snowrealm-insight-ctrl/notification-styles', label: '通知樣式', icon: Palette },
    { href: '/snowrealm-insight-ctrl/site-settings', label: '首頁 SEO',  icon: Globe },
  ]},
  { group: '系統監控', items: [
    { href: '/snowrealm-insight-ctrl/audit',         label: '操作審計',   icon: ClipboardList },
    { href: '/snowrealm-insight-ctrl/health',        label: '系統健康',   icon: HeartPulse },
    { href: '/snowrealm-insight-ctrl/analytics',     label: '分析儀表板', icon: TrendingDown },
  ]},
  { group: 'AI 設定', items: [
    { href: '/snowrealm-insight-ctrl/ai-settings',   label: 'AI 指令控制', icon: Bot },
  ]},
]

const THEME_STORAGE_KEY = 'sa_theme'

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<SuperAdminTheme>('starfield')
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as SuperAdminTheme | null
    if (saved && SA_THEMES.some(t => t.key === saved)) setTheme(saved)
  }, [])

  const handleTheme = (t: SuperAdminTheme) => {
    setTheme(t)
    localStorage.setItem(THEME_STORAGE_KEY, t)
    setThemePickerOpen(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/super-login')
  }

  const currentTheme = SA_THEMES.find(t => t.key === theme)!
  const accentColor = currentTheme.color

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
          >
            ⚡
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">SIE 控制台</p>
            <p className="text-[10px] text-white/30 font-mono">SYSTEM CTRL</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_ITEMS.map(group => (
          <div key={group.group}>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 px-3 mb-1.5">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/snowrealm-insight-ctrl' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group relative"
                    style={isActive ? {
                      background: `${accentColor}15`,
                      color: accentColor,
                    } : {}}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: accentColor }}
                      />
                    )}
                    <Icon
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={isActive ? { color: accentColor } : { color: 'rgba(255,255,255,0.35)' }}
                    />
                    <span className={isActive ? 'font-medium' : 'text-white/50 group-hover:text-white/75 transition-colors'}>{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: accentColor }} />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Theme + Logout */}
      <div className="px-3 pb-5 space-y-2 border-t border-white/[0.05] pt-3">
        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => setThemePickerOpen(p => !p)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
            <span className="flex-1 text-left">{currentTheme.emoji} {currentTheme.label}</span>
            <span className="text-[10px] text-white/20">主題</span>
          </button>
          {themePickerOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {SA_THEMES.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTheme(t.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${theme === t.key ? 'text-white' : 'text-white/50'}`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                  {theme === t.key && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>登出</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-white flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Three.js background */}
      {mounted && <SuperAdminBg theme={theme} />}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(3, 6, 18, 0.85)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-30 md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
          style={{ background: 'rgba(3, 6, 18, 0.90)', backdropFilter: 'blur(16px)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-white/40 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white">⚡ SIE 控制台</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-sm">{currentTheme.emoji}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

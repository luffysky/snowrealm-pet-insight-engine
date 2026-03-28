'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Newspaper, Plus, MessageCircle, User, X, PenSquare, Clapperboard, Bell, MoreHorizontal, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Only hide on full-screen creation / auth flows
const HIDDEN_PREFIXES = [
  '/login', '/register', '/super-login', '/forgot-password',
  '/story/create', '/story/view', '/write', '/api', '/privacy', '/terms', '/cookies',
  '/messages',
]

const COLLAPSE_KEY = 'bottomnav_collapsed'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user: authUser } = useAuth()
  const me = authUser ? { userId: authUser.userId, userName: authUser.userName } : null
  const [unreadDm, setUnreadDm] = useState(0)
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isCollapsed = localStorage.getItem(COLLAPSE_KEY) === 'true'
    setCollapsed(isCollapsed)
    // Init CSS variable
    const h = isCollapsed ? '1.75rem' : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
    document.documentElement.style.setProperty('--bnav-h', h)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSE_KEY, String(next))
    // Expose BottomNav height as CSS variable so other pages can adapt
    const h = next ? '1.75rem' : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
    document.documentElement.style.setProperty('--bnav-h', h)
  }

  useEffect(() => {
    if (!me) return
    const fetchUnread = () => {
      fetch('/api/admin/social/messages/unread')
        .then(r => r.ok ? r.json() : null)
        .then((d: { count?: number } | null) => { if (d?.count !== undefined) setUnreadDm(d.count) })
        .catch(() => {})
      fetch('/api/admin/social/notifications')
        .then(r => r.ok ? r.json() : null)
        .then((d: { notifications?: { readAt: string | null }[] } | null) => {
          if (d?.notifications) setUnreadNotif(d.notifications.filter(n => !n.readAt).length)
        }).catch(() => {})
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30_000)
    // Refresh immediately when a conversation is read
    window.addEventListener('dm-read', fetchUnread)
    return () => {
      clearInterval(t)
      window.removeEventListener('dm-read', fetchUnread)
    }
  }, [me])

  const hidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p))
  useEffect(() => {
    if (hidden) document.documentElement.style.setProperty('--bnav-h', '0px')
  }, [hidden])
  if (!mounted || hidden) return null

  const isActive = (path: string) => {
    if (path === '/u') return pathname.startsWith('/u/')
    return pathname.startsWith(path)
  }

  const tabCls = (path: string) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      isActive(path) ? 'text-amber-400' : 'text-white/35 hover:text-white/70'
    }`

  const labelCls = 'text-[10px] font-medium leading-none'

  return (
    <>
      {/* Spacer — shrinks when collapsed so content fills available space */}
      <div
        aria-hidden
        className="transition-all duration-300"
        style={{
          height: collapsed
            ? '1.75rem'
            : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      />

      {/* Nav container */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          transform: collapsed
            ? 'translateY(calc(4rem + env(safe-area-inset-bottom, 0px)))'
            : 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Collapse handle — always visible */}
        <div className="flex justify-center bg-slate-950/80 backdrop-blur-2xl border-t border-white/[0.07] pt-1 pb-0.5">
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? '展開導覽列' : '收起導覽列'}
            className="group flex items-center justify-center w-12 h-5 rounded-full hover:bg-white/10 transition-colors"
          >
            <div
              className="w-9 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors"
              style={{ transform: collapsed ? 'scaleY(-1)' : 'none', transition: 'transform 0.3s' }}
            />
          </button>
        </div>

        {/* Tab row */}
        <div
          className="bg-slate-950/90 backdrop-blur-2xl pb-[env(safe-area-inset-bottom,0px)]"
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-stretch h-16 max-w-lg mx-auto px-2" style={{ overflow: 'visible' }}>

            {/* 部落格 */}
            <Link href="/blogs" className={tabCls('/blogs')}>
              <Home className="w-5 h-5" strokeWidth={isActive('/blogs') ? 2.5 : 1.8} />
              <span className={labelCls}>部落格</span>
            </Link>

            {/* 社群 */}
            <Link href="/articles" className={tabCls('/articles')}>
              <Newspaper className="w-5 h-5" strokeWidth={isActive('/articles') ? 2.5 : 1.8} />
              <span className={labelCls}>社群</span>
            </Link>

            {/* 發布 — 中間懸浮按鈕，上移 */}
            <div className="flex items-center justify-center flex-1" style={{ overflow: 'visible' }}>
              <button
                onClick={() => setCreateOpen(true)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
                           flex items-center justify-center shadow-lg shadow-amber-500/25
                           hover:scale-105 active:scale-95 transition-transform"
                style={{ transform: 'translateY(-10px)' }}
              >
                <Plus className="w-6 h-6 text-slate-900 stroke-[2.5]" />
              </button>
            </div>

            {/* 更多 */}
            <button onClick={() => setMoreOpen(true)} className={`${tabCls('/notifications')} relative`}>
              <div className="relative">
                <MoreHorizontal className="w-5 h-5" strokeWidth={1.8} />
                {unreadNotif > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1
                                   bg-rose-500 text-white text-[9px] font-bold rounded-full
                                   flex items-center justify-center leading-none">
                    {unreadNotif > 99 ? '99+' : unreadNotif}
                  </span>
                )}
              </div>
              <span className={labelCls}>更多</span>
            </button>

            {/* 訊息 */}
            <button onClick={() => router.push('/messages')} className={`${tabCls('/messages')} relative`}>
              <div className="relative">
                <MessageCircle className="w-5 h-5" strokeWidth={isActive('/messages') ? 2.5 : 1.8} />
                {unreadDm > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1
                                   bg-rose-500 text-white text-[9px] font-bold rounded-full
                                   flex items-center justify-center leading-none">
                    {unreadDm > 99 ? '99+' : unreadDm}
                  </span>
                )}
              </div>
              <span className={labelCls}>訊息</span>
            </button>

            {/* 我的 */}
            <button
              onClick={() => {
                if (me) router.push(`/u/${me.userId}`)
                else router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
              }}
              className={tabCls('/u')}
            >
              <User className="w-5 h-5" strokeWidth={isActive('/u') ? 2.5 : 1.8} />
              <span className={labelCls}>我的</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Create modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          style={{ paddingBottom: 'calc(var(--bnav-h, 76px) + 1rem)' }}
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-white/60 tracking-wide">建立內容</p>
              <button onClick={() => setCreateOpen(false)} className="p-1 text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => { setCreateOpen(false); router.push('/write') }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                <PenSquare className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">發布貼文</p>
                <p className="text-xs text-white/40 mt-0.5">文字、圖片、長文章</p>
              </div>
            </button>
            <button
              onClick={() => { setCreateOpen(false); router.push('/story/create') }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Clapperboard className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">發布限時動態</p>
                <p className="text-xs text-white/40 mt-0.5">24 小時自動消失</p>
              </div>
            </button>
            <button
              onClick={() => { setCreateOpen(false); router.push('/insight-admin/blog') }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">雪境創作</p>
                <p className="text-xs text-white/40 mt-0.5">AI 輔助創作・互動體驗</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* More menu */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          style={{ paddingBottom: 'calc(var(--bnav-h, 76px) + 1rem)' }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white/60 tracking-wide">更多功能</p>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 通知 */}
            <Link
              href="/notifications"
              onClick={() => setMoreOpen(false)}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0 relative">
                <Bell className="w-5 h-5 text-rose-400" />
                {unreadNotif > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadNotif > 99 ? '99+' : unreadNotif}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">通知</p>
                <p className="text-xs text-white/40 mt-0.5">{unreadNotif > 0 ? `${unreadNotif} 則未讀` : '查看所有通知'}</p>
              </div>
            </Link>

            {/* 錢包 */}
            <Link
              href="/wallet"
              onClick={() => setMoreOpen(false)}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <span className="text-lg">🪙</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Z幣錢包</p>
                <p className="text-xs text-white/40 mt-0.5">查看餘額與交易紀錄</p>
              </div>
            </Link>

            {/* 部落格 */}
            <Link
              href="/blogs"
              onClick={() => setMoreOpen(false)}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">部落格</p>
                <p className="text-xs text-white/40 mt-0.5">瀏覽創作者文章</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

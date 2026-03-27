'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Newspaper, Plus, MessageCircle, User, X, PenSquare, Clapperboard } from 'lucide-react'

// 不顯示 bottom nav 的路徑前綴
const HIDDEN_PREFIXES = [
  '/insight-admin', '/snowrealm-insight-ctrl', '/login', '/register',
  '/super-login', '/forgot-password', '/write', '/story/create',
  '/api', '/privacy', '/terms', '/cookies',
]

interface UserInfo {
  userId: string
  userName: string
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<UserInfo | null>(null)
  const [unreadDm, setUnreadDm] = useState(0)
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const hidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { userId?: string; userName?: string } | null) => {
        if (d?.userId) setMe({ userId: d.userId, userName: d.userName ?? '' })
      })
      .catch(() => {})
  }, [])

  // 未讀訊息 + 通知數
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
        })
        .catch(() => {})
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [me])

  if (hidden) return null

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    if (path === '/u') return pathname.startsWith('/u/')
    return pathname.startsWith(path)
  }

  const tabCls = (path: string) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      isActive(path)
        ? 'text-amber-400'
        : 'text-white/35 hover:text-white/70 dark:text-slate-400/70'
    }`

  const labelCls = 'text-[10px] font-medium leading-none'

  return (
    <>
      {/* Spacer so page content isn't hidden behind nav */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden />

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Glassmorphism background */}
        <div className="bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl border-t border-white/8
                        pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-stretch h-16 max-w-lg mx-auto px-2">

            {/* 探索 */}
            <Link href="/explore" className={tabCls('/explore')}>
              <Home className="w-5 h-5" strokeWidth={isActive('/explore') ? 2.5 : 1.8} />
              <span className={labelCls}>探索</span>
            </Link>

            {/* 社群 */}
            <Link href="/articles" className={tabCls('/articles')}>
              <Newspaper className="w-5 h-5" strokeWidth={isActive('/articles') ? 2.5 : 1.8} />
              <span className={labelCls}>社群</span>
            </Link>

            {/* 發布 — 中間大按鈕 */}
            <div className="flex items-center justify-center flex-1">
              <button
                onClick={() => setCreateOpen(true)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
                           flex items-center justify-center shadow-lg shadow-amber-500/30
                           hover:scale-105 active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6 text-slate-900 stroke-[2.5]" />
              </button>
            </div>

            {/* 訊息 */}
            <button
              onClick={() => router.push('/messages')}
              className={`${tabCls('/messages')} relative`}
            >
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
              className={`${tabCls('/u')} relative`}
            >
              <div className="relative">
                <User className="w-5 h-5" strokeWidth={isActive('/u') ? 2.5 : 1.8} />
                {unreadNotif > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </div>
              <span className={labelCls}>我的</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Create modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
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
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface UserInfo {
  userId: string
  role: string
  tenantId: string
  userName: string
  tenantName?: string
}

export function HomeNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [zcoinBalance, setZcoinBalance] = useState<number | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.userId) {
          setUser(data)
          fetch('/api/zcoin')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.balance?.balance !== undefined) setZcoinBalance(d.balance.balance) })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSphereClick = () => {
    setSpinning(true)
    setDropOpen(prev => !prev)
    // reset animation class so it can re-trigger on next click
    setTimeout(() => setSpinning(false), 450)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  const close = () => setDropOpen(false)

  return (
    <div className="relative" ref={ref}>
      {/* 3D sphere button */}
      <button
        onClick={handleSphereClick}
        aria-label="選單"
        className={`relative flex items-center gap-2 rounded-full select-none
                    hover:brightness-110 active:scale-95 transition-[transform,filter]
                    ${spinning ? 'animate-sphere-pop' : ''}`}
        style={{
          background: 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.88) 0%, #7dd3fc 38%, #3b82f6 68%, #1e3a8a 100%)',
          boxShadow: '0 4px 18px rgba(59,130,246,0.45), inset 0 -4px 8px rgba(0,0,0,0.18), inset 0 4px 8px rgba(255,255,255,0.35)',
          padding: user ? '5px 14px 5px 7px' : '7px',
          minWidth: user ? undefined : '36px',
          height: '36px',
        }}
      >
        {/* Shine highlight */}
        <span
          aria-hidden
          className="absolute left-2 top-1.5 w-2 h-1 rounded-full bg-white/55 blur-[1px]"
          style={{ pointerEvents: 'none' }}
        />

        {user ? (
          <>
            {/* Avatar initial */}
            <span
              className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.6), transparent 70%)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {user.userName.charAt(0).toUpperCase()}
            </span>
            <span className="relative z-10 text-white text-sm font-semibold max-w-[80px] truncate drop-shadow-sm">
              {user.userName}
            </span>
          </>
        ) : (
          /* Hamburger for logged-out */
          <span className="relative z-10 flex flex-col gap-[4px] items-center justify-center w-4">
            <span className="w-4 h-0.5 bg-white rounded-full block" />
            <span className="w-3 h-0.5 bg-white rounded-full block" />
            <span className="w-4 h-0.5 bg-white rounded-full block" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropOpen && (
        <div className="absolute top-full right-0 mt-2.5 w-56 max-w-[calc(100vw-2rem)]
                        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                        border border-sky-100/80 dark:border-white/10
                        shadow-xl shadow-sky-100/30 dark:shadow-black/40
                        rounded-2xl py-2 z-50">
          {user ? (
            <>
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-sky-50 dark:border-white/8 mb-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.userName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.tenantName ?? user.tenantId}</p>
                {zcoinBalance !== null && (
                  <p className="text-xs text-amber-500 font-medium mt-1">🪙 {zcoinBalance} Z幣</p>
                )}
              </div>

              {/* Navigation links */}
              <Link href="/explore" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>🔍</span> 探索問卷
              </Link>
              <Link href={`/insight-admin/${user.tenantId}`} onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>📊</span> 進入後台
              </Link>
              <Link href="/articles" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>🌐</span> 社群文章
              </Link>
              <Link href="/write" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>✍️</span> 發布文章
              </Link>
              <Link href="/zcoin-shop" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <span>🪙</span> Z幣商店
              </Link>
              <Link href="/wallet" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>💼</span> 錢包記錄
              </Link>
              <Link href={`/insight-admin/${user.tenantId}/account`} onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>⚙️</span> 帳號設定
              </Link>
              {user.role === 'super_admin' && (
                <Link href="/snowrealm-insight-ctrl" onClick={close}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                  <span>⚡</span> 總控台
                </Link>
              )}
              <div className="border-t border-sky-50 dark:border-white/8 mt-1 pt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer">
                  <span>🚪</span> 登出
                </button>
              </div>
            </>
          ) : (
            /* Logged-out menu */
            <>
              <Link href="/explore" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>🔍</span> 探索問卷
              </Link>
              <Link href="/articles" onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                <span>🌐</span> 社群文章
              </Link>
              <div className="border-t border-sky-50 dark:border-white/8 mt-1 pt-1 px-4 py-2 flex flex-col gap-2">
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  onClick={close}
                  className="block text-center py-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
                >
                  登入
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="block text-center py-2 text-sm font-semibold rounded-full
                             bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400
                             text-white transition-all shadow-sm"
                >
                  免費註冊
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

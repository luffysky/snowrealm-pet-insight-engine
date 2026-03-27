'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

interface UserInfo {
  userId: string
  role: string
  tenantId: string
  userName: string
  tenantName?: string
}

export function HomeNav() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [zcoinBalance, setZcoinBalance] = useState<number | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.userId) {
          setUser(data)
          // 載入 Z幣餘額
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-3 relative" ref={ref}>
      <Link href="/explore" className="hidden sm:block text-sm text-sky-600/80 hover:text-sky-500 dark:text-sky-400/80 dark:hover:text-sky-300 transition-colors font-medium">探索問卷</Link>
      <ThemeToggle />
      {user ? (
        <>
          <button
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2 bg-white/70 hover:bg-white/90 border border-sky-200/60 shadow-sm rounded-full pl-1.5 pr-3 py-1.5 transition-all backdrop-blur-sm cursor-pointer"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700 font-medium">{user.userName}</span>
            {zcoinBalance !== null && (
              <span className="text-xs bg-amber-100 text-amber-600 border border-amber-200 rounded-full px-1.5 py-0.5 font-semibold">
                🪙 {zcoinBalance}
              </span>
            )}
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-sky-100/80 shadow-xl shadow-sky-100/30 rounded-2xl py-2 z-50">
              <div className="px-4 py-2.5 border-b border-sky-50 mb-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.userName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.tenantName ?? user.tenantId}</p>
                {zcoinBalance !== null && (
                  <p className="text-xs text-amber-500 font-medium mt-1">🪙 {zcoinBalance} Z幣</p>
                )}
              </div>
              <Link
                href={`/insight-admin/${user.tenantId}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>📊</span> 進入後台
              </Link>
              <Link
                href="/articles"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>🌐</span> 社群文章
              </Link>
              <Link
                href="/write"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>✍️</span> 發布文章
              </Link>
              <Link
                href="/zcoin-shop"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>🪙</span> Z幣商店
              </Link>
              <Link
                href="/wallet"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>💼</span> 錢包記錄
              </Link>
              <Link
                href={`/insight-admin/${user.tenantId}/account`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                <span>⚙️</span> 帳號設定
              </Link>
              {user.role === 'super_admin' && (
                <Link
                  href="/snowrealm-insight-ctrl"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                  onClick={() => setDropOpen(false)}
                >
                  <span>⚡</span> 總控台
                </Link>
              )}
              <div className="border-t border-sky-50 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <span>🚪</span> 登出
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm text-sky-600/80 hover:text-sky-600 transition-colors px-2 py-1 font-medium">
            登入
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white transition-all shadow-sm font-medium">
            免費註冊
          </Link>
        </>
      )}
    </div>
  )
}

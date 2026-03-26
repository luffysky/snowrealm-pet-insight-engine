'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface UserInfo {
  userId: string
  role: string
  tenantId: string
  userName: string
  tenantName?: string
}

export function HomeNav() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.userId) setUser(data)
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
      <Link href="/explore" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">探索問卷</Link>
      {user ? (
        <>
          <button 
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-full pl-1.5 pr-3 py-1.5 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-200">{user.userName}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-800 mb-1">
                <p className="text-sm font-medium text-white truncate">{user.userName}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
              <Link
                href={`/insight-admin/${user.tenantId}`}
                className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                📊 進入後台
              </Link>
              <Link
                href="/wallet"
                className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                🪙 Z幣錢包
              </Link>
              <Link
                href={`/insight-admin/${user.tenantId}/account`}
                className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setDropOpen(false)}
              >
                ⚙️ 帳號設定
              </Link>
              {user.role === 'super_admin' && (
                <Link
                  href="/snowrealm-insight-ctrl"
                  className="block px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                  onClick={() => setDropOpen(false)}
                >
                  ⚡ 控制台
                </Link>
              )}
              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  登出
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-2 py-1">
            登入
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            免費註冊
          </Link>
        </>
      )}
    </div>
  )
}

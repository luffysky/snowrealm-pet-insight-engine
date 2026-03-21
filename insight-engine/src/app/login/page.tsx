'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        const slug = data.slug
        const redirect = searchParams.get('redirect') || (slug ? `/insight-admin/${slug}` : '/insight-admin')
        window.location.href = redirect
        return
      } else {
        setError(data.error || '登入失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">� SnowRealm Insight Engine</h1>
            <p className="text-sm text-slate-400 mt-2">問卷系統管理後台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email / 手機 / 帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入 Email、手機號碼或帳號"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-cyan-400 hover:underline">忘記密碼？</a>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-slate-800/50 px-2 text-slate-500">或</span></div>
          </div>

          <button
            onClick={() => { window.location.href = '/api/auth/google' }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            使用 Google 登入
          </button>

          <button
            onClick={() => { window.location.href = '/api/auth/line' }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#06C755] hover:bg-[#05b54e] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.8.22.92.51.11.26.07.66.04.93l-.15.87c-.04.25-.2.97.85.53s5.6-3.3 7.64-5.64C21.97 14.22 22 12.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>
            使用 LINE 登入
          </button>

          <p className="text-xs text-slate-500 text-center">
            還沒有帳號？<a href="/register" className="text-cyan-400 hover:underline">免費註冊</a>
          </p>

          <div className="flex justify-center gap-3 text-xs text-slate-600">
            <a href="/privacy" className="hover:text-slate-400 transition-colors">隱私權政策</a>
            <span>·</span>
            <a href="/terms" className="hover:text-slate-400 transition-colors">使用者條款</a>
            <span>·</span>
            <a href="/cookies" className="hover:text-slate-400 transition-colors">Cookie 政策</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">載入中...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

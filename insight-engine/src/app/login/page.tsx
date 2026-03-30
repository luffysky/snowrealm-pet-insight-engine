'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const YukirinScene = dynamic(() => import('@/components/public/yukirin/YukirinScene'), { ssr: false })

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

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
    const inviteToken = searchParams.get('invite')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, invite: inviteToken || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        const slug = data.slug
        const redirect = searchParams.get('redirect') || (slug ? `/insight-admin/${slug}` : '/insight-admin')
        window.location.href = redirect
      } else {
        setError(data.error || '登入失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const inviteParam = searchParams.get('invite') ? `?invite=${searchParams.get('invite')}` : ''

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)', fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}
    >
      {/* 背景光暈 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-72 w-72 rounded-full bg-[#b8a9e8]/30 blur-3xl" />
        <div className="absolute right-[-8%] bottom-[10%] h-64 w-64 rounded-full bg-[#f5b8b5]/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* 迷你雪凜 */}
        <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-2 border-[#b8a9e8]/30 bg-gradient-to-br from-[#eee8ff]/60 to-[#ffeef5]/60 shadow-[0_8px_32px_rgba(184,169,232,0.3)]">
          <YukirinScene cameraMode="face" mood="happy" showBackground={false} className="h-full w-full" />
        </div>

        {/* 玻璃卡 */}
        <div className="lg-lavender-sharp lg-xl relative p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-black text-[#3d3155]">歡迎回來</h1>
            <p className="mt-1 text-sm text-[#8a7ca8]">登入 SnowRealm Insight</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8a7ca8]">Email / 手機 / 帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入帳號或 Email"
                className="w-full rounded-[14px] border border-[#b8a9e8]/30 bg-white/50 px-4 py-3 text-sm text-[#3d3155] placeholder-[#b5a8d0] backdrop-blur-sm transition focus:border-[#b8a9e8] focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#b8a9e8]/30"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8a7ca8]">密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="w-full rounded-[14px] border border-[#b8a9e8]/30 bg-white/50 px-4 py-3 pr-11 text-sm text-[#3d3155] placeholder-[#b5a8d0] backdrop-blur-sm transition focus:border-[#b8a9e8] focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#b8a9e8]/30"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5a8d0] transition hover:text-[#6b5fa8]"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-[#b8a9e8] hover:text-[#6b5fa8] transition-colors">忘記密碼？</Link>
            </div>

            {error && (
              <div className="rounded-[12px] border border-red-200/50 bg-red-50/60 px-4 py-2.5 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(184,169,232,0.4)] transition hover:scale-[1.01] hover:shadow-[0_12px_32px_rgba(184,169,232,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          {/* 分隔 */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#b8a9e8]/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/50 px-3 text-[#b5a8d0]">或</span>
            </div>
          </div>

          {/* OAuth */}
          <div className="space-y-3">
            <button
              onClick={() => { window.location.href = `/api/auth/google${inviteParam}` }}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#b8a9e8]/25 bg-white/60 py-3 text-sm font-medium text-[#3d3155] transition hover:bg-white/80"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              使用 Google 登入
            </button>

            <button
              onClick={() => { window.location.href = `/api/auth/line${inviteParam}` }}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#06C755] py-3 text-sm font-medium text-white transition hover:bg-[#05b54e]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.8.22.92.51.11.26.07.66.04.93l-.15.87c-.04.25-.2.97.85.53s5.6-3.3 7.64-5.64C21.97 14.22 22 12.5 22 10.5 22 5.82 17.52 2 12 2z"/>
              </svg>
              使用 LINE 登入
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[#b5a8d0]">
            還沒有帳號？
            <Link href={`/register${inviteParam}`} className="ml-1 text-[#b8a9e8] hover:text-[#6b5fa8] transition-colors">免費註冊</Link>
          </p>

          <div className="mt-4 flex justify-center gap-3 text-xs text-[#b5a8d0]">
            <Link href="/privacy" className="hover:text-[#8a7ca8] transition-colors">隱私權政策</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#8a7ca8] transition-colors">使用者條款</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)' }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#b8a9e8] border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

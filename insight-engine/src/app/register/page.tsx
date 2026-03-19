'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function RegisterForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center max-w-sm">
          <h1 className="text-xl font-bold text-white mb-3">⚠️ 無效的連結</h1>
          <p className="text-slate-400 text-sm">
            請透過 LINE 輸入口令取得註冊連結
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('兩次密碼不一致')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/admin')
      } else {
        setError(data.error || '註冊失敗')
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
            <h1 className="text-2xl font-bold text-white">🐾 毛行天下</h1>
            <p className="text-sm text-slate-400 mt-2">註冊管理員帳號</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="英文、數字、底線，3～30 字元"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">確認密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再輸入一次密碼"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center">
            已有帳號？<a href="/login" className="text-cyan-400 hover:underline">前往登入</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">載入中...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

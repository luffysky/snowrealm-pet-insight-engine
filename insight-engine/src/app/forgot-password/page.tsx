'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'email' | 'verify' | 'done'
type Channel = 'email' | 'phone'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [channel, setChannel] = useState<Channel>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [codeId, setCodeId] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // 倒數計時
  useState(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(prev => Math.max(prev - 1, 0)), 1000)
    return () => clearInterval(t)
  })

  const handleSendCode = async () => {
    setError('')
    if (channel === 'email' && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('請輸入有效的 Email'); return
    }
    if (channel === 'phone' && !phone) {
      setError('請輸入手機號碼'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(channel === 'email' ? { email } : { phone }),
          purpose: 'reset_password',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCodeId(data.codeId)
        setStep('verify')
        setCooldown(60)
      } else {
        setError(data.error || '驗證碼寄送失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) { setError('請輸入 6 位數驗證碼'); return }
    if (newPassword.length < 6) { setError('密碼至少 6 個字元'); return }
    if (newPassword !== confirmPassword) { setError('兩次密碼不一致'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(channel === 'email' ? { email } : { phone }),
          codeId, code, newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStep('done')
      } else {
        setError(data.error || '重設密碼失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600'

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">🔑 忘記密碼</h1>
            <p className="text-sm text-slate-400 mt-2">
              {step === 'email' && '選擇 Email 或手機來接收驗證碼'}
              {step === 'verify' && '輸入驗證碼並設定新密碼'}
              {step === 'done' && '密碼已重設成功！'}
            </p>
          </div>

          {step === 'email' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setChannel('email')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${channel === 'email' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  ✉️ Email
                </button>
                <button type="button" onClick={() => setChannel('phone')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${channel === 'phone' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  📱 手機
                </button>
              </div>
              {channel === 'email' ? (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" className={inputCls} autoComplete="email" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">手機號碼</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678" className={inputCls} autoComplete="tel" />
                </div>
              )}
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? '寄送中...' : '寄送驗證碼'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  驗證碼已寄送至 <span className="text-cyan-400 font-medium">{channel === 'email' ? email : phone}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">6 位數驗證碼</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">新密碼</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 6 個字元"
                    className={`${inputCls} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">確認新密碼</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再輸入一次新密碼"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                {loading ? '重設中...' : '重設密碼'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError('') }}
                className="w-full text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ← 返回修改 Email
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <p className="text-3xl">✅</p>
              <p className="text-white font-medium">密碼重設成功！</p>
              <Link
                href="/login"
                className="block w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors text-center"
              >
                前往登入
              </Link>
            </div>
          )}

          <div className="flex justify-center gap-3 text-xs text-slate-600">
            <Link href="/login" className="hover:text-slate-400 transition-colors">返回登入</Link>
            <span>·</span>
            <Link href="/register" className="hover:text-slate-400 transition-colors">註冊帳號</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

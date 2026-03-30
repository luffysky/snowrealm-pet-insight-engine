'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

function SuperAdminLoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const step = searchParams.get('step')
  const error = searchParams.get('error')
  const isPinStep = step === 'pin'

  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isPinStep) inputRefs.current[0]?.focus()
  }, [isPinStep])

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...pin]
    next[index] = value.slice(-1)
    setPin(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) submitPin(next.join(''))
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const submitPin = async (code: string) => {
    setLoading(true)
    setPinError('')
    try {
      const res = await fetch('/api/auth/line/super-admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      const data = await res.json() as { ok?: boolean; redirectTo?: string; error?: string }
      if (data.ok && data.redirectTo) {
        router.push('/snowrealm-insight-ctrl')
      } else {
        setPinError(data.error ?? 'PIN 碼錯誤')
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setPinError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const errorMessages: Record<string, string> = {
    line_not_configured: 'LINE 登入尚未設定',
    token_exchange: 'LINE 授權失敗',
    profile_error: '無法取得 LINE 個人資料',
    not_super_admin: '此帳號無總後台權限',
    no_account: '找不到對應的系統帳號',
    rate_limited: '嘗試過於頻繁，請稍後再試',
    server_error: '伺服器發生錯誤',
  }

  return (
    <div className="min-h-screen bg-[#03050e] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle star bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,30,70,0.6)_0%,_transparent_70%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(1px 1px at var(--x,50%) var(--y,50%), rgba(255,255,255,0.4) 0%, transparent 100%)',
        backgroundSize: '200px 200px',
      }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="lg-void-sharp lg-xl relative p-8 shadow-2xl shadow-black/60">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">SIE 系統控制台</h1>
            <p className="text-sm text-slate-400 mt-1">SnowRealm Insight Engine</p>
          </div>

          {/* Error banner */}
          {(error || pinError) && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-sm text-red-400 text-center">{pinError || errorMessages[error!] || error}</p>
            </div>
          )}

          {!isPinStep ? (
            /* Step 1: LINE Login */
            <div className="space-y-4">
              <button
                onClick={() => { window.location.href = '/api/auth/line/super-admin' }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#06C755] hover:bg-[#05b54e] text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#06C755]/20 active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.8.22.92.51.11.26.07.66.04.93l-.15.87c-.04.25-.2.97.85.53s5.6-3.3 7.64-5.64C21.97 14.22 22 12.5 22 10.5 22 5.82 17.52 2 12 2z"/>
                </svg>
                使用 LINE 驗證身份
              </button>
              <p className="text-xs text-slate-600 text-center">需要兩步驟驗證才能進入</p>
            </div>
          ) : (
            /* Step 2: PIN */
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-300 font-medium">LINE 身份驗證成功</p>
                <p className="text-xs text-slate-500 mt-1">請輸入 6 位數系統 PIN 碼</p>
              </div>
              <div className="flex justify-center gap-2.5">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    disabled={loading}
                    className="w-10 h-12 text-center text-lg font-bold bg-slate-800/80 border border-slate-600/50 rounded-xl text-white outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
                  />
                ))}
              </div>
              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              )}
              <button
                onClick={() => router.push('/super-login')}
                className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors text-center"
              >
                ← 重新登入
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 flex justify-center">
            <a href="/login" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← 一般後台登入</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#03050e] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    }>
      <SuperAdminLoginContent />
    </Suspense>
  )
}

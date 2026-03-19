'use client'

import { useState } from 'react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          nickname: nickname.trim(),
          contactInfo: contactInfo.trim(),
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message ?? '成功加入封測名單！')
      } else {
        setStatus('error')
        setMessage(data.error ?? '送出失敗，請稍後再試')
      }
    } catch {
      setStatus('error')
      setMessage('網路錯誤，請稍後再試')
    }
  }

  if (status === 'success') {
    return (
      <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
        <p className="text-emerald-400 text-sm">{message}</p>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="暱稱（選填）"
        maxLength={50}
        className={inputClass}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email *"
        required
        className={inputClass}
      />
      <input
        type="text"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
        placeholder="LINE ID 或 IG 帳號（選填）"
        maxLength={100}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
      >
        {status === 'loading' ? '送出中...' : '加入封測'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs">{message}</p>
      )}
    </form>
  )
}

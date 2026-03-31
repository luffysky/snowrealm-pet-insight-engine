'use client'

import { useState } from 'react'

interface SubscribeFormProps {
  userSlug: string
}

export function SubscribeForm({ userSlug }: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/blogs/${userSlug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error ?? '訂閱失敗，請稍後再試')
      }
    } catch {
      setStatus('error')
      setErrorMsg('網路錯誤，請稍後再試')
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-10 mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-6 py-6 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-sm font-medium text-emerald-400">訂閱成功！</p>
        <p className="text-xs text-white/40 mt-1">有新文章發布時，我們會通知你。</p>
      </div>
    )
  }

  return (
    <div className="mt-10 mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-6">
      <div className="text-center mb-4">
        <div className="text-2xl mb-1.5">📬</div>
        <p className="text-sm font-semibold text-white/80">訂閱最新文章</p>
        <p className="text-xs text-white/35 mt-1">有新文章發布時，第一時間收到通知</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="你的名字（選填）"
          maxLength={50}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/40 transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/40 transition-colors"
        />
        {status === 'error' && (
          <p className="text-xs text-rose-400">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="w-full py-2.5 bg-amber-500/20 border border-amber-400/20 text-amber-300 text-sm font-medium rounded-xl hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
        >
          {status === 'loading' ? '訂閱中...' : '訂閱更新'}
        </button>
        <p className="text-[10px] text-white/20 text-center">隨時可退訂，不會有垃圾郵件</p>
      </form>
    </div>
  )
}

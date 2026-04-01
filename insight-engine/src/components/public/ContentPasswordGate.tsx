'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface Props {
  unlockUrl: string
  onUnlocked: () => void
  title?: string
  description?: string
}

/**
 * 通用密碼保護閘門（長短貼文、相簿等前端解鎖）
 * Blog 文章用的是 ArticlePasswordGate（需 reload）
 */
export function ContentPasswordGate({ unlockUrl, onUnlocked, title, description }: Props) {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(unlockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '密碼錯誤')
      } else {
        onUnlocked()
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-5">
      <div className="w-full max-w-sm">
        {title && <h2 className="text-lg font-semibold text-white text-center mb-1">{title}</h2>}
        {description && <p className="text-white/40 text-sm text-center mb-6">{description}</p>}

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex flex-col items-center mb-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-sm text-white/60 text-center">此內容受密碼保護</p>
            <p className="text-xs text-white/30 text-center mt-0.5">輸入密碼以繼續查看</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="輸入密碼..."
                autoFocus
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-amber-500/50 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 bg-amber-500/90 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl transition-colors"
            >
              {loading ? '驗證中...' : '解鎖'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

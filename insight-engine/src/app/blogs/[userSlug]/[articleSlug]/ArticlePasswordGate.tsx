'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface Props {
  userSlug: string
  articleSlug: string
  title: string
  coverImage: string | null
  coverImagePosition: string | null
  summary: string | null
  authorName: string | null
}

export function ArticlePasswordGate({
  userSlug,
  articleSlug,
  title,
  coverImage,
  coverImagePosition,
  summary,
  authorName,
}: Props) {
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
      const res = await fetch(`/api/blogs/${userSlug}/${articleSlug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '密碼錯誤')
      } else {
        // 設定 cookie 成功 → 重載頁面顯示完整文章
        window.location.reload()
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {coverImage && (
        <div className="relative w-full h-[35vh] min-h-[200px] max-h-[380px] overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            style={{ objectPosition: coverImagePosition ?? 'center center' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">{title}</h1>
          {summary && (
            <p className="text-white/40 text-sm text-center mb-8">{summary}</p>
          )}

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm text-white/60 text-center">
                {authorName ? `${authorName} 將這篇文章設為密碼保護` : '這篇文章設有密碼保護'}
              </p>
              <p className="text-xs text-white/30 text-center mt-1">輸入密碼以繼續閱讀</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="輸入密碼..."
                  autoFocus
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-rose-400 text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full py-3 bg-amber-500/90 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl transition-colors"
              >
                {loading ? '驗證中...' : '解鎖文章'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

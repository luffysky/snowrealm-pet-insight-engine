'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface QuizResult {
  resultKey: string
  resultType: {
    key: string
    name: string
    emoji: string
    description: string
    traits?: string[]
  } | null
  surveyTitle: string
  shareUrl: string
}

export default function ResultPage() {
  const params = useParams<{ responseId: string }>()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!params.responseId) return
    fetch(`/api/quiz-result/${params.responseId}`)
      .then(r => (r.ok ? (r.json() as Promise<QuizResult>) : null))
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.responseId])

  function handleShare() {
    const url = result?.shareUrl ?? window.location.href
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/40 animate-pulse text-sm">載入結果中...</p>
      </div>
    )
  }

  if (!result?.resultType) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🎯</p>
        <h1 className="text-xl font-bold text-white">找不到結果</h1>
        <p className="text-white/50 text-sm">此連結可能已失效</p>
        <Link href="/explore" className="text-cyan-400 text-sm underline">
          探索其他問卷
        </Link>
      </div>
    )
  }

  const rt = result.resultType

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← 首頁
          </Link>
          <Link
            href="/explore"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            🔍 探索問卷
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <p className="text-center text-white/40 text-xs">{result.surveyTitle}</p>

        <div className="text-center space-y-4">
          <div className="text-8xl">{rt.emoji}</div>
          <h1 className="text-3xl font-bold">{rt.name}</h1>
          <p className="text-white/60 leading-relaxed text-sm">{rt.description}</p>
        </div>

        {rt.traits && rt.traits.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {rt.traits.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
          >
            {copied ? '✅ 已複製連結' : '📋 分享我的結果'}
          </button>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(result.shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl bg-[#06C755] hover:bg-[#05b34d] text-white text-sm font-semibold text-center transition-colors"
          >
            分享到 LINE
          </a>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/explore"
            className="text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            探索更多問卷 →
          </Link>
        </div>
      </div>
    </div>
  )
}

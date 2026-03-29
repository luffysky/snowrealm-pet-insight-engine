'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Copy, Check } from 'lucide-react'
import { useShareCard } from '@/hooks/useShareCard'

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
  const cardRef = useRef<HTMLDivElement>(null)
  const { saving, saveImage } = useShareCard()

  useEffect(() => {
    if (!params.responseId) return
    fetch(`/api/quiz-result/${params.responseId}`)
      .then(r => (r.ok ? (r.json() as Promise<QuizResult>) : null))
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.responseId])

  function handleCopy() {
    const url = result?.shareUrl ?? window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-[#8a7ca8] animate-pulse text-sm">載入結果中...</p>
      </div>
    )
  }

  if (!result?.resultType) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🎯</p>
        <h1 className="text-xl font-bold text-white">找不到結果</h1>
        <p className="text-[#6b5fa8] text-sm">此連結可能已失效</p>
        <Link href="/explore" className="text-cyan-400 text-sm underline">探索其他問卷</Link>
      </div>
    )
  }

  const rt = result.resultType

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
      </div>

      <nav className="sticky top-0 z-10 bg-transparent/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-[#6b5fa8] hover:text-white transition-colors">← 首頁</Link>
          <Link href="/explore" className="text-sm text-[#6b5fa8] hover:text-white transition-colors">
            🔍 探索問卷
          </Link>
        </div>
      </nav>

      <div className="relative max-w-md mx-auto px-4 py-10 space-y-6">
        <p className="text-center text-[#8a7ca8] text-xs tracking-wide">{result.surveyTitle}</p>

        {/* Liquid glass share card */}
        <div className="p-px rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-violet-500/15 shadow-2xl shadow-violet-900/20">
          <div
            ref={cardRef}
            className="rounded-[calc(1.5rem-1px)] overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #130d2a 0%, #0f172a 50%, #0d1535 100%)' }}
          >
            {/* Shimmer top bar */}
            <div className="h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0" />

            <div className="relative p-8 text-center space-y-5">
              {/* Glow behind emoji */}
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-2xl opacity-40 rounded-full"
                  style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
                <span className="relative text-8xl select-none">{rt.emoji}</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">{rt.name}</h1>
                <p className="text-[#6b5fa8]/85 leading-relaxed text-sm px-2">{rt.description}</p>
              </div>

              {rt.traits && rt.traits.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {rt.traits.map(t => (
                    <span key={t}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(139,92,246,0.12)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        color: 'rgba(196,181,253,0.85)',
                      }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Survey label */}
              <p className="text-[10px] tracking-widest uppercase font-medium"
                style={{ color: 'rgba(139,92,246,0.5)' }}>
                ✦ SnowRealm Insight Engine
              </p>
            </div>

            {/* Bottom shimmer */}
            <div className="h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-400/50 to-violet-500/0" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          {/* Save image */}
          <button
            onClick={() => saveImage(cardRef.current, `result-${rt.key}.png`)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))',
              border: '1px solid rgba(139,92,246,0.3)',
              color: 'rgba(196,181,253,0.95)',
            }}
          >
            <Download className="w-4 h-4" />
            {saving ? '儲存中...' : '💾 儲存結果圖片'}
          </button>

          {/* Share LINE */}
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(result.shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(6,199,85,0.2), rgba(4,150,64,0.15))',
              border: '1px solid rgba(6,199,85,0.3)',
              color: 'rgba(134,239,172,0.95)',
            }}
          >
            <span>💬</span> 分享到 LINE
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '已複製連結！' : '複製分享連結'}
          </button>
        </div>

        <div className="text-center pt-2">
          <Link href="/explore" className="text-xs text-[#8a7ca8]/60 hover:text-[#8a7ca8] transition-colors">
            探索更多問卷 →
          </Link>
        </div>
      </div>
    </div>
  )
}

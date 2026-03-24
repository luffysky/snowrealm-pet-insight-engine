'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { StoryCardData } from '@/lib/storyCardEngine'

function ShareButtons({ responseId, oneLiner }: { responseId: string; oneLiner: string }) {
  const [copied, setCopied] = useState(false)
  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/story/${responseId}`
    : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(oneLiner)}`

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      <a
        href={lineShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 rounded-full bg-[#06C755] text-white text-sm font-semibold hover:bg-[#05b34d] transition-colors"
      >
        分享到 LINE
      </a>
      <button
        onClick={handleCopy}
        className="px-5 py-2.5 rounded-full bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors"
      >
        {copied ? '已複製！' : '複製連結'}
      </button>
    </div>
  )
}

export default function StoryCardPage() {
  const params = useParams<{ responseId: string }>()
  const [card, setCard] = useState<StoryCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!params.responseId) return
    fetch(`/api/story-card/${params.responseId}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json() as Promise<StoryCardData>
      })
      .then(setCard)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.responseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white/50 text-sm animate-pulse">載入中...</p>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/60 text-center">找不到這張故事卡片，可能已被移除或連結有誤。</p>
        <a href="/" className="text-emerald-400 underline text-sm">回到首頁</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mb-1">我的問卷故事</p>
          <h1 className="text-white text-xl font-bold leading-snug">{card.surveyTitle}</h1>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Personal facts */}
          {card.personalFacts.length > 0 && (
            <section>
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">我的選擇</h2>
              <ul className="space-y-2">
                {card.personalFacts.map((fact, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80">
                    <span className="text-emerald-400 mt-0.5">▸</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Group comparisons */}
          {card.groupComparisons.length > 0 && (
            <section>
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">與大家比較</h2>
              <ul className="space-y-2">
                {card.groupComparisons.map((cmp, i) => (
                  <li key={i} className="bg-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white/80">
                    {cmp}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Shareable one-liner */}
          <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl px-4 py-4">
            <p className="text-amber-300 text-base font-semibold leading-snug text-center">
              {card.shareableOneLiner}
            </p>
          </section>

          {/* Share buttons */}
          <ShareButtons responseId={card.responseId} oneLiner={card.shareableOneLiner} />

          {/* CTA */}
          <div className="text-center pt-1">
            <a
              href={`/${card.surveySlug}`}
              className="text-emerald-400 text-sm underline hover:text-emerald-300 transition-colors"
            >
              填寫問卷，留下你的故事 →
            </a>
          </div>
        </div>
      </div>

      <p className="mt-6 text-white/20 text-xs">Powered by SnowRealm Insight Engine</p>
    </div>
  )
}

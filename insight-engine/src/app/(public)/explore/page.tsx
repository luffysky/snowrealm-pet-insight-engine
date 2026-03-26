'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface ExploreSurvey {
  id: string
  slug: string
  title: string
  subtitle: string
  coverTitle: string
  tenantId: string
  responseCount: number
  createdAt: string
}

export default function ExplorePage() {
  const [surveys, setSurveys] = useState<ExploreSurvey[]>([])
  const [sort, setSort] = useState<'popular' | 'new'>('popular')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchSurveys = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ sort, page: String(page) })
    if (search) params.set('q', search)

    const res = await fetch(`/api/explore?${params}`).catch(() => null)
    if (!res?.ok) { setLoading(false); return }

    const data = await res.json() as { surveys: ExploreSurvey[] }
    setSurveys(data.surveys)
    setLoading(false)
  }, [sort, search, page])

  useEffect(() => { fetchSurveys() }, [fetchSurveys])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
            ← SnowRealm Insight Engine
          </Link>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <Link href="/wallet" className="hover:text-white/80 transition-colors">🪙 Z幣錢包</Link>
            <Link href="/register" className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/30 transition-colors">
              免費註冊
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto space-y-8 px-4 py-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">🔍 探索問卷</h1>
          <p className="text-white/50 text-sm">瀏覽大家分享的公開問卷，找到你感興趣的主題</p>
        </div>

        {/* 情緒入口卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '😊', label: '輕鬆有趣', desc: '小測驗 & 娛樂', color: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/20', tag: '趣味' },
            { emoji: '🧠', label: '深度思考', desc: '心理 & 自我探索', color: 'from-indigo-500/15 to-purple-500/10', border: 'border-indigo-500/20', tag: '心理' },
            { emoji: '💬', label: '分享觀點', desc: '意見 & 生活態度', color: 'from-cyan-500/15 to-sky-500/10', border: 'border-cyan-500/20', tag: '觀點' },
            { emoji: '🎯', label: '實用調查', desc: '市場 & 商業回饋', color: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/20', tag: '調查' },
          ].map(card => (
            <button
              key={card.tag}
              type="button"
              onClick={() => { setSearchInput(card.tag); setSearch(card.tag); setPage(1) }}
              className={`group text-left rounded-2xl border ${card.border} bg-linear-to-br ${card.color} p-4 space-y-2 hover:scale-[1.02] transition-all`}
            >
              <span className="text-2xl">{card.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white/90 leading-snug">{card.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 搜尋 + 篩選 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="搜尋問卷標題..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm hover:bg-indigo-500/30 transition-colors"
            >
              搜尋
            </button>
          </form>

          <div className="flex gap-2">
            {(['popular', 'new'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setSort(s); setPage(1) }}
                className={`px-4 py-2.5 rounded-xl text-sm transition-colors border
                  ${sort === s
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/10 text-white/50 hover:text-white/70'}`}
              >
                {s === 'popular' ? '🔥 熱門' : '✨ 最新'}
              </button>
            ))}
          </div>
        </div>

        {/* 問卷列表 */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-white/30 animate-pulse">載入中...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="text-white/40">沒有找到符合的問卷</p>
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                清除搜尋條件
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map(s => (
              <Link
                key={s.id}
                href={`/${s.tenantId}/${s.slug}`}
                className="group block rounded-2xl border border-white/10 bg-white/3 hover:bg-white/6 p-5 space-y-3 transition-all hover:border-white/20"
              >
                <div className="space-y-1.5">
                  <h3 className="text-white font-semibold leading-snug group-hover:text-white/90 transition-colors line-clamp-2">
                    {s.title}
                  </h3>
                  {s.subtitle && (
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{s.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>👥 {s.responseCount.toLocaleString()} 人填過</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分頁 */}
        {surveys.length > 0 && (
          <div className="flex justify-center gap-3">
            {page > 1 && (
              <button
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                ← 上一頁
              </button>
            )}
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/70 transition-colors"
            >
              下一頁 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

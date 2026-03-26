'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { StoryWallItem } from '@/lib/storyWallEngine'

interface WallResponse {
  items: StoryWallItem[]
  total: number
  page: number
  pageSize: number
  topKeywords?: string[]
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-1/3 mb-3" />
      <div className="h-4 bg-slate-700 rounded w-3/4" />
    </div>
  )
}

function StoryCard({ item }: { item: StoryWallItem }) {
  return (
    <a
      href={`/story/${item.responseId}`}
      className="block bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-750 transition-all duration-200 group"
    >
      {item.isPinned && (
        <span className="inline-block text-xs font-semibold text-amber-400 mb-2">📌 置頂</span>
      )}
      <p className="text-white/40 text-xs mb-2 truncate">{item.surveyTitle}</p>
      <p className="text-white/80 text-sm leading-relaxed group-hover:text-white transition-colors">
        {item.shareableOneLiner}
      </p>
      <p className="text-white/30 text-xs mt-3">
        {new Date(item.createdAt).toLocaleDateString('zh-TW')} · 查看故事卡片 →
      </p>
    </a>
  )
}

export default function StoryWallPage() {
  const params = useParams<{ surveySlug: string }>()
  const surveySlug = params.surveySlug

  const [items, setItems] = useState<StoryWallItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [topKeywords, setTopKeywords] = useState<string[]>([])
  const PAGE_SIZE = 20

  const fetchPage = async (pageNum: number, append: boolean) => {
    const isFirst = !append
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(`/api/story-wall/${surveySlug}?page=${pageNum}&pageSize=${PAGE_SIZE}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json() as WallResponse
      setItems((prev) => append ? [...prev, ...data.items] : data.items)
      setTotal(data.total)
      setPage(pageNum)
      if (!append && data.topKeywords) setTopKeywords(data.topKeywords)
    } catch {
      // silent — empty state handles it
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (surveySlug) fetchPage(1, false)
  }, [surveySlug])

  const hasMore = items.length < total

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-sm text-white/50 hover:text-white transition-colors">← 首頁</a>
          <a href="/explore" className="text-sm text-white/50 hover:text-white transition-colors">🔍 探索問卷</a>
        </div>
      </nav>
      <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">故事牆</h1>
          <p className="text-white/50 text-sm">
            {loading ? '載入中...' : total > 0 ? `📖 共 ${total} 個故事` : ''}
          </p>
          {!loading && topKeywords.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {topKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 rounded-full bg-slate-700/60 text-white/60 text-xs border border-slate-600/40"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </header>

        {loading && (
          <div className="grid gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg mb-2">還沒有人分享故事</p>
            <p className="text-sm">成為第一個吧！</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid gap-4">
            {items.map((item) => (
              <StoryCard key={item.responseId} item={item} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetchPage(page + 1, true)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? '載入中...' : '載入更多'}
            </button>
          </div>
        )}

        {/* Permanent CTA */}
        <div className="mt-16 text-center py-10 border-t border-slate-700/50">
          <p className="text-white/60 text-base mb-4">💛 看完他們的故事，也來分享你的？</p>
          <a
            href={`/${surveySlug}`}
            className="inline-block px-8 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
          >
            開始填問卷
          </a>
        </div>

        <p className="mt-6 text-center text-white/20 text-xs">Powered by SnowRealm Insight Engine</p>
      </div>
      </div>
    </div>
  )
}

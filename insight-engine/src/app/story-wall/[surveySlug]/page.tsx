'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { StoryWallItem } from '@/lib/storyWallEngine'

interface StoryWallResponse {
  items: StoryWallItem[]
  total: number
  topKeywords: string[]
}

export default function StoryWallPage() {
  const params = useParams()
  const surveySlug = params.surveySlug as string

  const [items, setItems] = useState<StoryWallItem[]>([])
  const [total, setTotal] = useState(0)
  const [keywords, setKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://insight.snowrealm.pet'

  useEffect(() => {
    setLoading(true)
    fetch(`/api/story-wall/${surveySlug}?page=${page}&pageSize=${pageSize}`)
      .then(r => r.ok ? r.json() as Promise<StoryWallResponse> : null)
      .then(data => {
        if (data) {
          setItems(prev => page === 1 ? data.items : [...prev, ...data.items])
          setTotal(data.total)
          if (page === 1) setKeywords(data.topKeywords)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [surveySlug, page])

  const hasMore = items.length < total

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-xs text-white/30 font-medium tracking-wider uppercase">SnowRealm Insight Engine</p>
          <h1 className="text-2xl font-bold text-white">📖 故事牆</h1>
          <p className="text-sm text-slate-400">共 {total} 個故事</p>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/50">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && items.length === 0 && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse h-28" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">📖</p>
            <p className="text-white/50">這裡還沒有故事</p>
          </div>
        )}

        {/* Story Cards */}
        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.responseId}
                className={`relative bg-white/5 border rounded-2xl p-5 space-y-3 transition-all ${
                  item.isPinned ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/10'
                }`}
              >
                {item.isPinned && (
                  <span className="absolute top-3 right-3 text-xs text-violet-400">📌 置頂</span>
                )}
                {item.shareableOneLiner && (
                  <p className="text-sm text-white/80 italic">「{item.shareableOneLiner}」</p>
                )}
                {item.groupComparisons?.length > 0 && (
                  <ul className="space-y-1">
                    {item.groupComparisons.slice(0, 2).map((c, i) => (
                      <li key={i} className="text-xs text-indigo-300/70 flex items-start gap-1.5">
                        <span>👥</span>{c}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-white/25">
                    {new Date(item.createdAt).toLocaleDateString('zh-TW')}
                  </p>
                  <a
                    href={`${baseUrl}/story/${item.responseId}`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    查看完整卡片 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-xl transition-colors"
            >
              載入更多
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-white/10 pt-8 text-center space-y-4">
          <p className="text-white/70">💛 看完他們的故事，也來分享你的？</p>
          <a
            href={`${baseUrl}/survey/${surveySlug}`}
            className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            ✍️ 開始填問卷
          </a>
        </div>
      </div>
    </div>
  )
}

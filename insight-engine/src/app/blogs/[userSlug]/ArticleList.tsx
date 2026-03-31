'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutList, LayoutGrid } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  cover_image_position: string | null
  tags: string[]
  view_count: number
  published_at: string
}

interface ArticleListProps {
  articles: Article[]
  blogSlug: string
}

type LayoutMode = 'list' | 'grid'

export function ArticleList({ articles, blogSlug }: ArticleListProps) {
  const storageKey = `blog-layout-${blogSlug}`
  const [layout, setLayout] = useState<LayoutMode>('list')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as LayoutMode | null
      if (saved === 'grid' || saved === 'list') setLayout(saved)
    } catch { /* ignore */ }
  }, [storageKey])

  const changeLayout = (next: LayoutMode) => {
    setLayout(next)
    try { localStorage.setItem(storageKey, next) } catch { /* ignore */ }
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20 text-white/25">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-sm">還沒有公開文章</p>
      </div>
    )
  }

  return (
    <div>
      {/* Layout toggle */}
      <div className="flex justify-end mb-4 gap-1">
        <button
          onClick={() => changeLayout('list')}
          aria-label="列表模式"
          title="列表模式"
          className={`p-1.5 rounded-lg transition-colors ${
            layout === 'list'
              ? 'bg-white/10 text-white/80'
              : 'text-white/25 hover:text-white/50 hover:bg-white/[0.05]'
          }`}
        >
          <LayoutList className="w-4 h-4" />
        </button>
        <button
          onClick={() => changeLayout('grid')}
          aria-label="格狀模式"
          title="格狀模式"
          className={`p-1.5 rounded-lg transition-colors ${
            layout === 'grid'
              ? 'bg-white/10 text-white/80'
              : 'text-white/25 hover:text-white/50 hover:bg-white/[0.05]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>

      {layout === 'list' ? (
        <div className="space-y-6">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/blogs/${blogSlug}/${article.slug}`}
              className="group flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 lg-dark-sharp lg-shimmer lg-lg relative overflow-hidden hover:bg-white/[0.03] transition-all"
            >
              {article.cover_image && (
                <div className="shrink-0 w-full sm:w-28 h-40 sm:h-20 rounded-xl overflow-hidden">
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    width={112}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: article.cover_image_position ?? 'center center' }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-sm text-white/45 mt-1.5 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-[11px] text-white/25">
                  <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                  <span>·</span>
                  <span>👁 {article.view_count}</span>
                  {article.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex gap-1.5">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded-md text-white/35">{tag}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/blogs/${blogSlug}/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 overflow-hidden transition-all"
            >
              {article.cover_image ? (
                <div className="relative w-full h-44 overflow-hidden">
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: article.cover_image_position ?? 'center center' }}
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-amber-500/10 to-violet-500/10 flex items-center justify-center text-3xl">
                  📄
                </div>
              )}
              <div className="flex flex-col flex-1 p-4">
                <h2 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2 flex-1">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-2.5 mt-3 text-[11px] text-white/25">
                  <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                  <span>·</span>
                  <span>👁 {article.view_count}</span>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded-md text-[10px] text-white/35">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

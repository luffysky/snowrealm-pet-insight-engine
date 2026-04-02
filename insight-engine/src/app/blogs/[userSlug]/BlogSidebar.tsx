'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, FolderOpen, Tag, BookOpen, Sparkles, Users, X } from 'lucide-react'

interface Series {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  is_completed: boolean
  article_count: number
}

interface OtherArticle {
  title: string
  slug: string
  blog_slug: string
  author_name: string
  author_avatar: string | null
  published_at: string
}

interface SimilarArticle {
  title: string
  slug: string
  blog_slug: string
  author_name: string
  tags: string[]
}

interface BlogSidebarProps {
  blogSlug: string
  categories: string[]
  series: Series[]
  otherArticles: OtherArticle[]
  similarArticles: SimilarArticle[]
  activeCategory: string | null
  onCategoryChange: (cat: string | null) => void
}

export function BlogSidebar({
  blogSlug, categories, series, otherArticles, similarArticles,
  activeCategory, onCategoryChange,
}: BlogSidebarProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      try {
        const saved = localStorage.getItem('blog-sidebar-open')
        if (saved !== null) setOpen(saved === 'true')
        else setOpen(true)
      } catch { /* ignore */ }
    }
  }, [isMobile])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (!isMobile) {
      try { localStorage.setItem('blog-sidebar-open', String(next)) } catch { /* ignore */ }
    }
  }

  const hasContent = categories.length > 0 || series.length > 0 || otherArticles.length > 0 || similarArticles.length > 0
  if (!hasContent) return null

  const contentProps = { blogSlug, categories, series, otherArticles, similarArticles, activeCategory, onCategoryChange }

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        <button
          onClick={toggleOpen}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-slate-800/90 backdrop-blur border border-white/10 border-l-0 rounded-r-xl px-1.5 py-4 text-white/50 hover:text-white/80 transition-colors"
          aria-label="開啟側邊欄"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {open && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <aside className="relative w-72 max-w-[80vw] bg-slate-900 border-r border-white/10 overflow-y-auto"
              style={{ animation: 'slideInLeft .2s ease-out' }}>
              <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-white/8 z-10">
                <span className="text-sm font-semibold text-white/70">目錄</span>
                <button onClick={() => setOpen(false)} className="p-1 text-white/40 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent {...contentProps} onCategoryChange={(cat) => { onCategoryChange(cat); setOpen(false) }} />
            </aside>
          </div>
        )}
      </>
    )
  }

  // Desktop: collapsible sidebar
  return (
    <aside className={`shrink-0 transition-all duration-300 ${open ? 'w-56' : 'w-8'} relative`}>
      <button
        onClick={toggleOpen}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-slate-700 transition-colors"
        aria-label={open ? '收合側邊欄' : '展開側邊欄'}
      >
        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {open && (
        <div className="sticky top-8 pr-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <SidebarContent {...contentProps} />
        </div>
      )}
    </aside>
  )
}

/* ── Sidebar Content ── */

function SidebarContent({
  blogSlug, categories, series, otherArticles, similarArticles,
  activeCategory, onCategoryChange,
}: Omit<BlogSidebarProps, 'onCategoryChange'> & { onCategoryChange: (cat: string | null) => void }) {
  return (
    <nav className="px-4 py-4 space-y-6 text-sm">
      {/* ── 文章分類 ── */}
      {categories.length > 0 && (
        <section>
          <SectionTitle icon={<Tag className="w-3.5 h-3.5" />} text="文章分類" />
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => onCategoryChange(null)}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                  activeCategory === null ? 'bg-white/10 text-white/80' : 'text-white/45 hover:text-white/65 hover:bg-white/[0.04]'
                }`}
              >
                全部文章
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat}>
                <button
                  onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                    activeCategory === cat ? 'bg-violet-500/15 text-violet-300/80' : 'text-white/45 hover:text-white/65 hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 系列文章 ── */}
      {series.length > 0 && (
        <section>
          <SectionTitle icon={<BookOpen className="w-3.5 h-3.5" />} text="系列文章" />
          <ul className="space-y-1">
            {series.map(s => (
              <li key={s.id}>
                <Link
                  href={`/blogs/${blogSlug}/series/${s.id}`}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-lg text-white/45 hover:text-white/70 hover:bg-white/[0.04] transition-colors group"
                >
                  <FolderOpen className="w-4 h-4 mt-0.5 shrink-0 text-amber-400/50 group-hover:text-amber-400/70" />
                  <div className="min-w-0">
                    <div className="font-medium text-white/60 group-hover:text-white/80 line-clamp-2 leading-snug">{s.title}</div>
                    <div className="text-[11px] text-white/25 mt-0.5">
                      {s.article_count} 篇{s.is_completed ? ' · 已完結' : ''}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 類似文章（同 tag） ── */}
      {similarArticles.length > 0 && (
        <section>
          <SectionTitle icon={<Sparkles className="w-3.5 h-3.5" />} text="你可能也喜歡" />
          <ul className="space-y-1">
            {similarArticles.map((a, i) => (
              <li key={`${a.blog_slug}-${a.slug}-${i}`}>
                <Link
                  href={`/blogs/${a.blog_slug}/${a.slug}`}
                  className="block px-3 py-2 rounded-lg text-white/45 hover:text-white/70 hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="font-medium text-white/55 group-hover:text-white/80 line-clamp-2 leading-snug text-[13px]">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-white/25 mt-0.5">
                    by {a.author_name}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 其他部落格主的文章 ── */}
      {otherArticles.length > 0 && (
        <section>
          <SectionTitle icon={<Users className="w-3.5 h-3.5" />} text="其他作者近期文章" />
          <ul className="space-y-1">
            {otherArticles.map((a, i) => (
              <li key={`${a.blog_slug}-${a.slug}-${i}`}>
                <Link
                  href={`/blogs/${a.blog_slug}/${a.slug}`}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-lg text-white/45 hover:text-white/70 hover:bg-white/[0.04] transition-colors group"
                >
                  {a.author_avatar ? (
                    <Image
                      src={a.author_avatar}
                      alt={a.author_name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">✍</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-white/55 group-hover:text-white/80 line-clamp-2 leading-snug text-[13px]">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-white/25 mt-0.5">
                      {a.author_name} · {new Date(a.published_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 導航 ── */}
      <section>
        <SectionTitle text="探索更多" />
        <ul className="space-y-0.5">
          <li>
            <Link href="/blogs" className="sidebar-nav-link">
              <span className="text-base">📚</span> 所有部落格
            </Link>
          </li>
          <li>
            <Link href="/" className="sidebar-nav-link">
              <span className="text-base">🏠</span> SnowRealm 首頁
            </Link>
          </li>
        </ul>
      </section>
    </nav>
  )
}

function SectionTitle({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
      {icon}{text}
    </h3>
  )
}

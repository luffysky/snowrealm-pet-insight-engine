'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

// ─── Reading Progress Bar ─────────────────────────────────────────────────────
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const celebratedRef = useRef(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
      setProgress(pct)

      // BLOG-2: celebration toast at 95%
      if (pct >= 95 && !celebratedRef.current) {
        celebratedRef.current = true
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* BLOG-2: Completion toast */}
      <div
        aria-live="polite"
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-800 border border-white/10 text-white/90 text-sm px-5 py-3 rounded-2xl shadow-2xl whitespace-nowrap">
          ✅ 讀完了！感謝你閱讀到最後 😊
        </div>
      </div>
    </>
  )
}

// ─── BLOG-1: Table of Contents ────────────────────────────────────────────────
interface TableOfContentsProps {
  headings: Heading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (headings.length === 0) return

    const targets = headings
      .map(h => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting entry
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  return (
    <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white/80 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium">
          <span>📋</span>
          <span>目錄</span>
          <span className="text-xs text-white/30 font-normal">({headings.length} 個章節)</span>
        </span>
        <span className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <nav className="px-4 pb-4 border-t border-white/[0.06]" aria-label="文章目錄">
          <ol className="mt-3 space-y-1.5">
            {headings.map(h => (
              <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setOpen(false)}
                  className={`block text-sm leading-snug py-0.5 transition-colors hover:text-amber-400 ${
                    activeId === h.id
                      ? 'text-amber-400 font-medium'
                      : 'text-white/45'
                  }`}
                >
                  {h.level === 3 && (
                    <span className="mr-1.5 text-white/20 text-xs">└</span>
                  )}
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  )
}

// ─── Reactions ────────────────────────────────────────────────────────────────
const EMOJIS = ['❤️', '🔥', '👏', '😮', '😂', '🎉'] as const

function getFingerprint(): string {
  const key = 'blog_fp'
  try {
    let fp = localStorage.getItem(key)
    if (!fp) {
      fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(key, fp)
    }
    return fp
  } catch { return 'anonymous' }
}

interface ReactionsProps {
  userSlug: string
  articleSlug: string
}

export function ArticleReactions({ userSlug, articleSlug }: ReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const fp = useRef(getFingerprint())

  useEffect(() => {
    fetch(`/api/blogs/${userSlug}/${articleSlug}/reactions`)
      .then(r => r.json())
      .then(d => { if (d.reactions) setReactions(d.reactions) })
      .catch(() => {})
  }, [userSlug, articleSlug])

  const toggle = useCallback(async (emoji: string) => {
    if (loading) return
    setLoading(true)
    const added = !myReactions.has(emoji)
    setMyReactions(prev => {
      const next = new Set(prev)
      added ? next.add(emoji) : next.delete(emoji)
      return next
    })
    setReactions(prev => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (added ? 1 : -1)),
    }))

    try {
      const res = await fetch(`/api/blogs/${userSlug}/${articleSlug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, fingerprint: fp.current }),
      })
      const data = await res.json() as { reactions?: Record<string, number> }
      if (data.reactions) setReactions(data.reactions)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [loading, myReactions, userSlug, articleSlug])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {EMOJIS.map(emoji => {
        const count = reactions[emoji] ?? 0
        const active = myReactions.has(emoji)
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border
              ${active
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 scale-105'
                : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/8 hover:text-white/80'
              }`}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && <span className="tabular-nums text-xs font-medium">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Comments ─────────────────────────────────────────────────────────────────
interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
  like_count: number
}

interface CommentsProps {
  userSlug: string
  articleSlug: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '剛剛'
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return new Date(iso).toLocaleDateString('zh-TW')
}

export function ArticleComments({ userSlug, articleSlug }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/blogs/${userSlug}/${articleSlug}/comments`)
      .then(r => r.json())
      .then(d => { setComments((d.comments ?? []).map((c: Comment) => ({ ...c, like_count: c.like_count ?? 0 }))); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [userSlug, articleSlug])

  const likeComment = async (commentId: string) => {
    const fp = getFingerprint()
    const isLiked = likedComments.has(commentId)
    setLikedComments(prev => { const next = new Set(prev); isLiked ? next.delete(commentId) : next.add(commentId); return next })
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: Math.max(0, c.like_count + (isLiked ? -1 : 1)) } : c))
    try {
      await fetch(`/api/blogs/${userSlug}/${articleSlug}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      })
    } catch { /* ignore */ }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true); setMsg('')
    try {
      const res = await fetch(`/api/blogs/${userSlug}/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name || '匿名訪客', content }),
      })
      const data = await res.json() as { comment?: Comment; error?: string }
      if (res.ok && data.comment) {
        setComments(prev => [...prev, data.comment!])
        setContent(''); setMsg('留言成功！')
        setTimeout(() => setMsg(''), 3000)
      } else {
        setMsg(data.error ?? '留言失敗')
      }
    } catch { setMsg('留言失敗，請稍後再試') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
        💬 留言
        {loaded && comments.length > 0 && (
          <span className="text-sm text-white/30 font-normal">({comments.length})</span>
        )}
      </h3>

      {loaded && comments.length === 0 ? (
        <p className="text-sm text-white/25 py-4 text-center">還沒有留言，來留下第一個吧！</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">
                {c.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-white/80">{c.author_name}</span>
                  <span className="text-xs text-white/25">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                <button
                  onClick={() => likeComment(c.id)}
                  className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                    likedComments.has(c.id)
                      ? 'text-rose-400'
                      : 'text-white/25 hover:text-white/50'
                  }`}
                >
                  <span>{likedComments.has(c.id) ? '❤️' : '🤍'}</span>
                  {c.like_count > 0 && <span>{c.like_count}</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 pt-2 border-t border-white/8">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="你的名字（選填）"
          maxLength={50}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-colors"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="寫下你的想法..."
          rows={3}
          maxLength={1000}
          required
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/20">{content.length} / 1000</span>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-xs ${msg.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-sm rounded-xl hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
            >
              {submitting ? '送出中...' : '發表留言'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Dark / Light Mode Toggle ─────────────────────────────────────────────────

/** Detect if a CSS color value is near-white (invisible on light background) */
function isNearWhiteColor(color: string): boolean {
  const c = color.trim().toLowerCase()
  if (c === 'white' || c === '#fff' || c === '#ffffff') return true
  if (c.startsWith('#')) {
    const hex = c.slice(1)
    const full = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      return (r + g + b) / 3 > 210
    }
  }
  if (c.startsWith('rgb')) {
    const nums = c.match(/\d+/g)?.slice(0, 3).map(Number)
    if (nums && nums.length === 3) return nums.reduce((a, b) => a + b, 0) / 3 > 210
  }
  return false
}

/** Fix TipTap inline colors that are near-white when switching to light mode */
function fixInlineColorsForTheme(toLight: boolean) {
  if (typeof document === 'undefined') return
  const spans = document.querySelectorAll<HTMLSpanElement>('.blog-content span[style]')
  spans.forEach(span => {
    const raw = span.getAttribute('style') ?? ''
    const m = raw.match(/color:\s*([^;]+)/)
    if (!m) return
    const colorVal = m[1].trim()
    if (toLight && isNearWhiteColor(colorVal)) {
      span.dataset.origColor = colorVal
      span.style.setProperty('color', '#1a1020', 'important')
    } else if (!toLight && span.dataset.origColor) {
      span.style.removeProperty('color')
      span.style.color = span.dataset.origColor
      delete span.dataset.origColor
    }
  })
}

export function ArticleThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blog-theme')
      if (saved === 'light') {
        setIsDark(false)
        document.documentElement.classList.add('blog-light')
        // Fix near-white inline colors on initial load in light mode
        // Defer until after article content is rendered
        setTimeout(() => fixInlineColorsForTheme(true), 100)
      }
    } catch { /* ignore */ }
  }, [])

  const toggle = () => {
    const toLight = isDark
    setIsDark(!isDark)
    try {
      if (toLight) {
        document.documentElement.classList.add('blog-light')
        localStorage.setItem('blog-theme', 'light')
        fixInlineColorsForTheme(true)
      } else {
        document.documentElement.classList.remove('blog-light')
        localStorage.setItem('blog-theme', 'dark')
        fixInlineColorsForTheme(false)
      }
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? '切換淺色模式' : '切換深色模式'}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-all"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

// ─── BLOG-17: Font Size Toggle ─────────────────────────────────────────────────
type FontSize = 'small' | 'medium' | 'large'

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: 'blog-font-small',
  medium: 'blog-font-medium',
  large: 'blog-font-large',
}

export function FontSizeToggle() {
  const [size, setSize] = useState<FontSize>('medium')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blog-font-size') as FontSize | null
      if (saved && saved in FONT_SIZE_CLASSES) {
        applyFontSize(saved)
        setSize(saved)
      }
    } catch { /* ignore */ }
  }, [])

  function applyFontSize(next: FontSize) {
    const root = document.documentElement
    Object.values(FONT_SIZE_CLASSES).forEach(cls => root.classList.remove(cls))
    root.classList.add(FONT_SIZE_CLASSES[next])
  }

  const handleChange = (next: FontSize) => {
    setSize(next)
    applyFontSize(next)
    try { localStorage.setItem('blog-font-size', next) } catch { /* ignore */ }
  }

  return (
    <div className="flex items-center gap-0.5" title="調整字體大小">
      <button
        onClick={() => handleChange('small')}
        aria-label="縮小字體"
        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors ${
          size === 'small'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            : 'text-white/35 hover:text-white/60 hover:bg-white/[0.06]'
        }`}
      >
        A<sup>-</sup>
      </button>
      <button
        onClick={() => handleChange('medium')}
        aria-label="預設字體"
        className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors ${
          size === 'medium'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            : 'text-white/35 hover:text-white/60 hover:bg-white/[0.06]'
        }`}
      >
        A
      </button>
      <button
        onClick={() => handleChange('large')}
        aria-label="放大字體"
        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[15px] transition-colors ${
          size === 'large'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            : 'text-white/35 hover:text-white/60 hover:bg-white/[0.06]'
        }`}
      >
        A<sup>+</sup>
      </button>
    </div>
  )
}

// ─── BLOG-3: Author Card ──────────────────────────────────────────────────────
interface RecentArticle {
  id: string
  title: string
  slug: string
  published_at: string
}

interface AuthorCardProps {
  userSlug: string
  authorName: string
  authorAvatar: string | null
  blogSlug: string
}

export function AuthorCard({ userSlug, authorName, authorAvatar, blogSlug }: AuthorCardProps) {
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])

  useEffect(() => {
    fetch(`/api/blogs/${userSlug}`)
      .then(r => r.json())
      .then((d: { articles?: RecentArticle[] }) => {
        setRecentArticles((d.articles ?? []).slice(0, 3))
      })
      .catch(() => {})
  }, [userSlug])

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      {/* Author info row */}
      <div className="flex items-center gap-3 mb-4">
        {authorAvatar ? (
          <Image
            src={authorAvatar}
            alt={authorName}
            width={48}
            height={48}
            className="rounded-full object-cover ring-2 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-xl shrink-0">
            ✍️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85">{authorName}</p>
          <Link
            href={`/blogs/${blogSlug}`}
            className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors mt-0.5 inline-block"
          >
            查看更多文章 →
          </Link>
        </div>
      </div>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/25 uppercase tracking-wider mb-2">最新文章</p>
          {recentArticles.map(a => (
            <Link
              key={a.id}
              href={`/blogs/${blogSlug}/${a.slug}`}
              className="flex items-start justify-between gap-3 group py-1"
            >
              <span className="text-sm text-white/55 leading-snug line-clamp-1 group-hover:text-white/80 transition-colors flex-1">
                {a.title}
              </span>
              <span className="text-[11px] text-white/25 shrink-0 mt-0.5">
                {new Date(a.published_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BLOG-18: Code Copy Buttons ──────────────────────────────────────────────

/** Scans all pre>code blocks inside .blog-content and injects a copy button */
export function CodeCopyButtons() {
  useEffect(() => {
    const container = document.querySelector('.blog-content')
    if (!container) return

    const preElements = container.querySelectorAll<HTMLPreElement>('pre')

    preElements.forEach(pre => {
      // Avoid duplicate buttons on re-render
      if (pre.querySelector('[data-copy-btn]')) return

      pre.style.position = 'relative'

      const btn = document.createElement('button')
      btn.setAttribute('data-copy-btn', 'true')
      btn.textContent = '複製'
      btn.setAttribute('aria-label', '複製程式碼')
      btn.style.cssText = [
        'position:absolute',
        'top:8px',
        'right:8px',
        'padding:2px 8px',
        'font-size:11px',
        'line-height:1.6',
        'border-radius:6px',
        'border:1px solid rgba(255,255,255,0.15)',
        'background:rgba(255,255,255,0.08)',
        'color:rgba(255,255,255,0.5)',
        'cursor:pointer',
        'transition:all 0.15s',
        'z-index:10',
      ].join(';')

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255,255,255,0.14)'
        btn.style.color = 'rgba(255,255,255,0.8)'
      })
      btn.addEventListener('mouseleave', () => {
        if (btn.textContent !== '已複製') {
          btn.style.background = 'rgba(255,255,255,0.08)'
          btn.style.color = 'rgba(255,255,255,0.5)'
        }
      })

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')
        const text = code?.innerText ?? pre.innerText
        try {
          await navigator.clipboard.writeText(text)
          btn.textContent = '已複製'
          btn.style.background = 'rgba(34,197,94,0.2)'
          btn.style.borderColor = 'rgba(34,197,94,0.4)'
          btn.style.color = 'rgb(134,239,172)'
          setTimeout(() => {
            btn.textContent = '複製'
            btn.style.background = 'rgba(255,255,255,0.08)'
            btn.style.borderColor = 'rgba(255,255,255,0.15)'
            btn.style.color = 'rgba(255,255,255,0.5)'
          }, 2000)
        } catch {
          btn.textContent = '失敗'
          setTimeout(() => { btn.textContent = '複製' }, 2000)
        }
      })

      pre.appendChild(btn)
    })
  }, [])

  return null
}

// ─── BLOG-4: Related Articles ─────────────────────────────────────────────────
interface RelatedArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  tags: string[]
  published_at: string
}

interface RelatedArticlesProps {
  userSlug: string
  articleSlug: string
  tags: string[]
  blogSlug: string
}

export function RelatedArticles({ userSlug, articleSlug, tags, blogSlug }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<RelatedArticle[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (tags.length === 0) { setLoaded(true); return }
    fetch(`/api/blogs/${userSlug}/${articleSlug}/related`)
      .then(r => r.json())
      .then((d: { articles?: RelatedArticle[] }) => {
        setArticles(d.articles ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [userSlug, articleSlug, tags])

  if (!loaded || tags.length === 0 || articles.length === 0) return null

  return (
    <div className="mt-10 pt-8 border-t border-white/[0.07]">
      <h3 className="text-base font-semibold text-white/80 mb-4">🔗 相關文章</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {articles.map(a => (
          <Link
            key={a.id}
            href={`/blogs/${blogSlug}/${a.slug}`}
            className="group flex flex-col gap-2 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all"
          >
            {a.cover_image && (
              <div className="relative w-full h-24 rounded-lg overflow-hidden mb-1">
                <Image
                  src={a.cover_image}
                  alt={a.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors leading-snug line-clamp-2">
              {a.title}
            </p>
            {a.summary && (
              <p className="text-xs text-white/35 leading-relaxed line-clamp-2">
                {a.summary}
              </p>
            )}
            <p className="text-[11px] text-white/25 mt-auto">
              {new Date(a.published_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

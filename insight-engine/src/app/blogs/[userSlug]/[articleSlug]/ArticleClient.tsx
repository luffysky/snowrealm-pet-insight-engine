'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'

// ─── Reading Progress Bar ─────────────────────────────────────────────────────
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-white/5">
      <div
        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
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
    // Optimistic update
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
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/blogs/${userSlug}/${articleSlug}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [userSlug, articleSlug])

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

      {/* Comment list */}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
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
export function ArticleThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blog-theme')
      if (saved === 'light') {
        setIsDark(false)
        document.documentElement.classList.add('blog-light')
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
      } else {
        document.documentElement.classList.remove('blog-light')
        localStorage.setItem('blog-theme', 'dark')
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

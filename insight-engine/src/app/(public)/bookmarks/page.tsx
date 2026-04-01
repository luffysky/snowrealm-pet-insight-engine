'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Heart, MessageSquare, Share2, X, Loader2 } from 'lucide-react'
import { LoginPrompt } from '@/components/social/LoginPrompt'
import { PostShareCard } from '@/components/social/PostShareCard'
import { ImageCarousel } from '@/components/social/ImageCarousel'

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookmarkPost {
  id: string
  type: string
  title: string | null
  content: string
  images: { url: string }[]
  tags: string[]
  userId: string
  authorName: string | null
  authorAvatar: string | null
  likesCount: number
  commentsCount: number
}

interface BookmarkItem {
  id: string
  postId: string
  createdAt: string
  post: BookmarkPost
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractFirstImageSrc(html: string): string {
  return /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] ?? ''
}

// ── Bookmark Card ─────────────────────────────────────────────────────────────
function BookmarkCard({
  item,
  meId,
  onUnbookmark,
}: {
  item: BookmarkItem
  meId: string | null
  onUnbookmark: (postId: string) => void
}) {
  const router = useRouter()
  const { post } = item
  const [bookmarked, setBookmarked] = useState(true)
  const [bookmarking, setBookmarking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [liking, setLiking] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)
  const postUrl = `/articles/${post.id}`

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmarking) return
    setBookmarking(true)
    try {
      const res = await fetch('/api/posts/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      if (res.status === 401) { setLoginPrompt(true); return }
      const data = await res.json() as { isBookmarked?: boolean }
      if (res.ok) {
        const next = data.isBookmarked ?? false
        setBookmarked(next)
        if (!next) onUnbookmark(post.id)
      }
    } finally {
      setBookmarking(false)
    }
  }

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liking) return
    setLiking(true)
    const next = !liked
    setLiked(next)
    setLikesCount(c => next ? c + 1 : Math.max(0, c - 1))
    try {
      const res = await fetch('/api/admin/social/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, type: 'like' }),
      })
      if (res.status === 401) {
        setLiked(!next)
        setLikesCount(c => next ? Math.max(0, c - 1) : c + 1)
        setLoginPrompt(true)
        return
      }
      if (res.ok) {
        const data = await res.json() as { likesCount: number }
        setLikesCount(data.likesCount)
      } else {
        setLiked(!next)
        setLikesCount(c => next ? Math.max(0, c - 1) : c + 1)
      }
    } catch {
      setLiked(!next)
      setLikesCount(c => next ? Math.max(0, c - 1) : c + 1)
    } finally {
      setLiking(false)
    }
  }

  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()
  const timeStr = new Date(item.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

  const imgs = post.images.length > 0
    ? post.images
    : (() => { const s = extractFirstImageSrc(post.content); return s ? [{ url: s }] : [] })()

  if (!bookmarked) return null

  return (
    <>
      <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} />
      {lightboxUrl && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 p-2 text-[#6b5fa8] hover:text-[#3d3155] bg-white/10 rounded-full" onClick={() => setLightboxUrl(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
      {showShareCard && (
        <PostShareCard
          post={{ ...post, id: post.id, createdAt: item.createdAt, tags: post.tags, images: post.images, videoUrl: null, videoThumbnailUrl: null, isBookmarked: true, myReaction: null, isFollowing: false } as never}
          onClose={() => setShowShareCard(false)}
        />
      )}
      <article
        onClick={() => router.push(postUrl)}
        className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden hover:border-[#b8a9e8]/40 transition-all group cursor-pointer"
      >
        {imgs.length > 0 && (
          <div className="overflow-hidden" onClick={e => e.stopPropagation()}>
            <ImageCarousel
              images={imgs}
              aspectRatio="video"
              onImageClick={setLightboxUrl}
              className="rounded-none"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/u/${post.userId}`} onClick={e => e.stopPropagation()}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden shrink-0 hover:ring-2 hover:ring-amber-400/30 transition-all"
            >
              {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
            </Link>
            <Link href={`/u/${post.userId}`} onClick={e => e.stopPropagation()}
              className="text-xs text-[#6b5fa8] font-medium hover:text-[#3d3155] transition-colors"
            >{post.authorName ?? '用戶'}</Link>
            <span className="text-xs text-[#8a7ca8]/60">·</span>
            <span className="text-xs text-[#8a7ca8]/75">{timeStr}</span>
            {post.type === 'article' && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">文章</span>
            )}
          </div>

          {/* Content */}
          {post.title && <h3 className="font-bold text-[#3d3155] text-base line-clamp-2">{post.title}</h3>}
          <p className="text-sm text-[#6b5fa8] leading-relaxed line-clamp-3">{stripHtml(post.content)}</p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map(t => (
                <span key={t} className="text-xs text-amber-400/50">#{t}</span>
              ))}
            </div>
          )}

          {/* Interaction bar */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button onClick={toggleLike} disabled={liking}
                className={`flex items-center gap-1 min-w-[44px] min-h-[44px] px-2 py-2 rounded-lg text-xs transition-colors justify-center ${liked ? 'text-red-400 bg-red-400/10' : 'text-[#8a7ca8]/75 hover:text-red-400 hover:bg-white/5'}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
                {likesCount > 0 && <span>{likesCount}</span>}
              </button>
              <button onClick={e => { e.stopPropagation(); router.push(`${postUrl}#comments`) }}
                className="flex items-center gap-1 min-w-[44px] min-h-[44px] px-2 py-2 rounded-lg text-xs text-[#8a7ca8]/75 hover:text-blue-400 hover:bg-white/5 transition-colors justify-center"
              >
                <MessageSquare className="w-4 h-4" />
                {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={e => { e.stopPropagation(); setShowShareCard(true) }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#8a7ca8] hover:text-[#6b5fa8] hover:bg-white/5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={toggleBookmark} disabled={bookmarking}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors text-amber-500 hover:text-amber-400"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookmarksPage() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => { if (d?.userId) setMeId(d.userId) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/social/bookmarks')
      .then(r => {
        if (r.status === 401) { router.push('/login?redirect=/bookmarks'); return null }
        return r.ok ? r.json() as Promise<{ bookmarks: BookmarkItem[] }> : null
      })
      .then(d => { if (d?.bookmarks) setBookmarks(d.bookmarks) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const handleUnbookmark = useCallback((postId: string) => {
    setBookmarks(prev => prev.filter(b => b.post.id !== postId))
  }, [])

  return (
    <div className="min-h-screen text-[#3d3155]" style={{ background: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)', fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif', paddingBottom: 'var(--bnav-h, 76px)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-xl border-b border-[#b8a9e8]/20 bg-[rgba(243,238,255,0.88)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#6b5fa8] hover:text-[#3d3155] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-500" />
            <h1 className="text-base font-semibold text-[#3d3155]">我的收藏</h1>
          </div>
          {bookmarks.length > 0 && (
            <span className="ml-auto text-xs text-[#8a7ca8]/75">{bookmarks.length} 篇</span>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[#8a7ca8] animate-spin" />
            <p className="text-sm text-[#8a7ca8]/75">載入中...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">
              <Bookmark className="w-12 h-12 text-[#b8a9e8]/40 mx-auto" />
            </p>
            <p className="text-[#8a7ca8] text-base mb-2">還沒有收藏任何內容</p>
            <p className="text-sm text-[#8a7ca8]/60 mb-6">瀏覽社群時，點擊書籤圖示即可收藏</p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/15 border border-amber-400/30 text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-500/25 transition-colors"
            >
              探索社群
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookmarks.map(item => (
              <BookmarkCard
                key={item.id}
                item={item}
                meId={meId}
                onUnbookmark={handleUnbookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

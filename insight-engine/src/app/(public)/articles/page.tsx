'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, TrendingUp, Heart, MessageSquare, Share2, Check, ExternalLink, PenSquare, Play, Bookmark } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import type { SocialPost } from '@/lib/socialEngine'
import { CreatePostModal } from '@/components/public/CreatePostModal'

const CATEGORIES = [
  { key: '', label: '全部', emoji: '✨' },
  { key: 'post', label: '短貼文', emoji: '💬' },
  { key: 'article', label: '長文章', emoji: '📝' },
]

function PostPreviewCard({ post }: { post: SocialPost }) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false)
  const [bookmarking, setBookmarking] = useState(false)
  const postUrl = `/articles/${post.id}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin + postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (bookmarking) return
    setBookmarking(true)
    try {
      const res = await fetch('/api/posts/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json() as { isBookmarked?: boolean; error?: string }
      if (res.ok) setBookmarked(data.isBookmarked ?? !bookmarked)
    } finally {
      setBookmarking(false)
    }
  }

  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()
  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

  return (
    <article className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-3xl overflow-hidden hover:border-white/16 hover:bg-white/[0.06] transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {/* Video preview */}
      {post.videoUrl && (
        <div className="relative overflow-hidden h-48 bg-black">
          <img src={post.videoThumbnailUrl ?? ''} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">🎬 影片</span>
        </div>
      )}

      {/* Image preview */}
      {!post.videoUrl && post.images.length > 0 && (
        <div className="relative overflow-hidden h-48">
          <img src={post.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {post.images.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">+{post.images.length - 1}</span>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden shrink-0">
            {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <span className="text-xs text-white/50 font-medium">{post.authorName ?? '用戶'}</span>
          <span className="text-xs text-white/25">·</span>
          <span className="text-xs text-white/30">{timeStr}</span>
          {post.type === 'article' && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">文章</span>
          )}
        </div>

        {/* Content */}
        {post.title && <h3 className="font-bold text-white/90 text-base line-clamp-2">{post.title}</h3>}
        <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{post.content}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs text-amber-400/50">#{t}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-white/30">
              <Heart className="w-3.5 h-3.5" /> {post.likesCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/30">
              <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setShowShare(s => !s)}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              {showShare && (
                <div className="absolute right-0 bottom-full mb-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 py-1 min-w-[130px]" onMouseLeave={() => setShowShare(false)}>
                  <button onClick={copyLink} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    {copied ? '已複製' : '複製連結'}
                  </button>
                  <button
                    onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin + postUrl)}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5"
                  >
                    <span className="text-sm">💬</span> LINE
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + postUrl)}&text=${encodeURIComponent(post.title ?? post.content.slice(0, 80))}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" /> Twitter
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={toggleBookmark}
              disabled={bookmarking}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-white/25 hover:text-amber-400 hover:bg-white/5'
              }`}
              title={bookmarked ? '取消收藏' : '收藏'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <Link href={postUrl} className="p-1.5 rounded-lg text-white/25 hover:text-amber-300 hover:bg-white/5 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function ArticlesPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('tag') ? `#${searchParams.get('tag')}` : '')
  const [typeFilter, setTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') ?? '')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const LIMIT = 12

  // Sync tagFilter → URL
  function applyTagFilter(tag: string) {
    setTagFilter(tag)
    setSearch(tag ? `#${tag}` : '')
    const url = new URL(window.location.href)
    if (tag) url.searchParams.set('tag', tag)
    else url.searchParams.delete('tag')
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const loadPosts = useCallback(async (reset = false) => {
    setLoading(true)
    const off = reset ? 0 : offset
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json() as { posts: SocialPost[] }
      const fetched = data.posts ?? []
      setPosts(prev => reset ? fetched : [...prev, ...fetched])
      setOffset(off + LIMIT)
      setHasMore(fetched.length === LIMIT)
    } finally {
      setLoading(false)
    }
  }, [offset, typeFilter])

  useEffect(() => { loadPosts(true) }, [typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = (search || tagFilter)
    ? posts.filter(p => {
        const s = search.replace(/^#/, '').toLowerCase()
        return p.content.toLowerCase().includes(s) ||
          (p.title ?? '').toLowerCase().includes(s) ||
          p.tags.some(t => t.toLowerCase().includes(s))
      })
    : posts

  const trendingTags = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 8)

  function handlePostCreated(newPost: SocialPost) {
    setPosts(prev => [newPost, ...prev])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Create post modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="發文"
      >
        <PenSquare className="w-6 h-6" />
      </button>

      {/* Hero */}
      <div className="relative bg-gradient-to-b from-slate-900/80 to-slate-950 border-b border-white/8 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-4xl mb-3">✨</p>
          <h1 className="text-3xl font-bold text-white mb-2">社群文章</h1>
          <p className="text-white/40 text-sm">探索問卷洞察、分享觀點、找到共鳴</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value) applyTagFilter('') }}
              placeholder="搜尋文章、標籤..."
              className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-sm text-white placeholder-white/30"
            />
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setTypeFilter(c.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  typeFilter === c.key ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending tags */}
        {trendingTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="flex items-center gap-1 text-xs text-white/30">
              <TrendingUp className="w-3.5 h-3.5" /> 熱門：
            </span>
            {trendingTags.map(t => (
              <button key={t} onClick={() => applyTagFilter(tagFilter === t ? '' : t)}
                className={`text-xs px-2.5 py-1 border rounded-full transition-colors ${
                  tagFilter === t
                    ? 'bg-amber-500/10 border-amber-400/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-amber-300 hover:border-amber-400/30'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-white/40">沒有找到相關文章</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(post => <PostPreviewCard key={post.id} post={post} />)}
            </div>
            {hasMore && !search && (
              <div className="flex justify-center mt-8">
                <button onClick={() => loadPosts(false)} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /> 載入中</> : '載入更多'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ArticlesPageInner />
    </Suspense>
  )
}

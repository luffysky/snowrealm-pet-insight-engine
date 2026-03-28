'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, TrendingUp, Heart, MessageSquare, Share2, Check, PenSquare, Play, Bookmark, UserPlus, ExternalLink, X, ZoomIn, ClipboardList, Sparkles, Users } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import type { SocialPost } from '@/lib/socialEngine'
import { CreatePostModal } from '@/components/public/CreatePostModal'
import { LoginPrompt } from '@/components/social/LoginPrompt'
import { FollowButton } from '@/components/social/FollowButton'
import { PostShareCard } from '@/components/social/PostShareCard'
import { StoryCircles } from '@/components/social/StoryCircles'

// ── types ──────────────────────────────────────────────────────────────────
interface ExploreSurvey {
  id: string
  slug: string
  title: string
  subtitle: string | null
  coverTitle: string | null
  tenantId: string
  tenantName: string | null
  responseCount: number
  createdAt: string
}

interface ExploreStory {
  responseId: string
  surveyTitle: string
  surveySlug: string
  tenantName: string | null
  oneLiner: string | null
  createdAt: string
}

interface ExploreUser {
  id: string
  displayName: string | null
  avatarUrl: string | null
  postCount: number
  followerCount: number
}

// ── Post card (existing) ───────────────────────────────────────────────────
const CATEGORIES = [
  { key: '', label: '短貼文', emoji: '💬' },
  { key: 'article', label: '長文章', emoji: '📝' },
]

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractFirstImageSrc(html: string): string {
  return /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] ?? ''
}

function PostPreviewCard({ post, meId }: { post: SocialPost; meId: string | null }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false)
  const [bookmarking, setBookmarking] = useState(false)
  const [liked, setLiked] = useState(!!(post.myReaction))
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [liking, setLiking] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)
  const postUrl = `/articles/${post.id}`
  const isOwn = meId === post.userId

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(window.location.origin + postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmarking) return
    setBookmarking(true)
    const next = !bookmarked
    setBookmarked(next)
    try {
      const res = await fetch('/api/posts/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      if (res.status === 401) { setBookmarked(!next); setLoginPrompt(true); return }
      const data = await res.json() as { isBookmarked?: boolean; error?: string }
      if (res.ok) setBookmarked(data.isBookmarked ?? next)
      else setBookmarked(!next)
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
        setLiked(!next); setLikesCount(c => next ? Math.max(0, c - 1) : c + 1)
        setLoginPrompt(true); return
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
  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

  return (
    <>
    <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} />
    {lightboxUrl && (
      <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
        <button className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/10 rounded-full" onClick={() => setLightboxUrl(null)}>
          <X className="w-5 h-5" />
        </button>
        <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
      </div>
    )}
    {showShareCard && (
      <PostShareCard post={post} onClose={() => setShowShareCard(false)} />
    )}
    <article
      onClick={() => router.push(postUrl)}
      className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-3xl overflow-hidden hover:border-white/16 hover:bg-white/[0.06] transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer">
      {post.videoUrl && (
        <div className="relative overflow-hidden h-48 bg-black">
          <img src={post.videoThumbnailUrl ?? ''} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )}
      {!post.videoUrl && (() => {
        const imgUrl = post.images[0]?.url || (post.type === 'article' ? extractFirstImageSrc(post.content) : '')
        return imgUrl ? (
          <div className="relative overflow-hidden h-48 cursor-zoom-in" onClick={e => { e.stopPropagation(); setLightboxUrl(imgUrl) }}>
            <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {post.images.length > 1 && (
              <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">+{post.images.length - 1}</span>
            )}
          </div>
        ) : null
      })()}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/u/${post.userId}`} onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden shrink-0 hover:ring-2 hover:ring-amber-400/30 transition-all"
          >
            {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
          </Link>
          <Link href={`/u/${post.userId}`} onClick={e => e.stopPropagation()}
            className="text-xs text-white/50 font-medium hover:text-white/80 transition-colors"
          >{post.authorName ?? '用戶'}</Link>
          {!isOwn && post.userId && (
            meId ? (
              <div onClick={e => e.stopPropagation()}>
                <FollowButton targetUserId={post.userId} compact onLoginRequired={() => setLoginPrompt(true)} />
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setLoginPrompt(true) }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-amber-400/70 border border-amber-400/25 rounded-full hover:bg-amber-400/10 transition-colors"
              >
                <UserPlus className="w-2.5 h-2.5" /> 追蹤
              </button>
            )
          )}
          <span className="text-xs text-white/25">·</span>
          <span className="text-xs text-white/30">{timeStr}</span>
          {post.type === 'article' && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">文章</span>
          )}
        </div>
        {post.title && <h3 className="font-bold text-white/90 text-base line-clamp-2">{post.title}</h3>}
        <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{stripHtml(post.content)}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs text-amber-400/50">#{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button onClick={toggleLike} disabled={liking}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${liked ? 'text-red-400 bg-red-400/10' : 'text-white/30 hover:text-red-400 hover:bg-white/5'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button onClick={e => { e.stopPropagation(); router.push(`${postUrl}#comments`) }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/30 hover:text-blue-400 hover:bg-white/5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); setShowShareCard(true) }}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleBookmark} disabled={bookmarking}
              className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-white/25 hover:text-amber-400 hover:bg-white/5'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
    </>
  )
}

// ── Survey card ────────────────────────────────────────────────────────────
function SurveyCard({ survey }: { survey: ExploreSurvey }) {
  const href = `/${survey.tenantId}/${survey.slug}`
  const label = survey.coverTitle || survey.title

  return (
    <Link href={href}
      className="group flex flex-col bg-white/[0.04] border border-white/8 rounded-3xl overflow-hidden hover:border-amber-400/20 hover:bg-white/[0.07] transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      {/* Gradient banner */}
      <div className="h-20 bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-blue-500/15 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-amber-400/60 group-hover:text-amber-400/90 transition-colors" />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {survey.tenantName && (
          <span className="text-[10px] text-white/30 uppercase tracking-wider">{survey.tenantName}</span>
        )}
        <h3 className="text-sm font-semibold text-white/85 line-clamp-2 leading-snug">{label}</h3>
        {survey.subtitle && (
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{survey.subtitle}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-xs text-white/30">{survey.responseCount.toLocaleString()} 人填答</span>
          <span className="text-xs text-amber-400/70 group-hover:text-amber-300 transition-colors">立即填答 →</span>
        </div>
      </div>
    </Link>
  )
}

// ── Story mini-card ────────────────────────────────────────────────────────
function StoryMiniCard({ story }: { story: ExploreStory }) {
  const timeStr = new Date(story.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/story/${story.responseId}`}
      className="group flex flex-col bg-gradient-to-br from-purple-900/30 to-slate-900/60 border border-purple-400/15 rounded-3xl p-4 gap-3 hover:border-purple-400/30 hover:from-purple-900/40 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-purple-400/60" />
        <span className="text-[10px] text-purple-300/50 uppercase tracking-wider">故事小卡</span>
        <span className="ml-auto text-[10px] text-white/20">{timeStr}</span>
      </div>
      {story.oneLiner && (
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 italic">「{story.oneLiner}」</p>
      )}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] text-white/30 truncate">{story.surveyTitle}</span>
        <span className="text-[10px] text-purple-400/60 group-hover:text-purple-300 shrink-0 transition-colors">查看 →</span>
      </div>
    </Link>
  )
}

// ── Creator card ───────────────────────────────────────────────────────────
function CreatorCard({ user, meId }: { user: ExploreUser; meId: string | null }) {
  const initials = (user.displayName ?? '?').charAt(0).toUpperCase()
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/8 rounded-2xl hover:bg-white/[0.06] transition-colors">
      <Link href={`/u/${user.id}`} className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/30 to-indigo-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/u/${user.id}`} className="text-sm font-medium text-white/80 hover:text-white truncate block transition-colors">
          {user.displayName ?? '用戶'}
        </Link>
        <p className="text-[10px] text-white/30">{user.followerCount} 粉絲 · {user.postCount} 貼文</p>
      </div>
      {meId && meId !== user.id && (
        <FollowButton targetUserId={user.id} compact />
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
type ExploreTab = 'posts' | 'surveys' | 'stories' | 'creators'

function ArticlesPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ExploreTab>('posts')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [surveys, setSurveys] = useState<ExploreSurvey[]>([])
  const [stories, setStories] = useState<ExploreStory[]>([])
  const [creators, setCreators] = useState<ExploreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('tag') ? `#${searchParams.get('tag')}` : '')
  const [postTypeFilter, setPostTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') ?? '')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)
  const LIMIT = 12

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => { if (d?.userId) setMeId(d.userId) })
      .catch(() => {})
  }, [])

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
      if (postTypeFilter) params.set('type', postTypeFilter)
      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json() as { posts: SocialPost[] }
      const fetched = data.posts ?? []
      setPosts(prev => reset ? fetched : [...prev, ...fetched])
      setOffset(off + LIMIT)
      setHasMore(fetched.length === LIMIT)
    } finally {
      setLoading(false)
    }
  }, [offset, postTypeFilter])

  const loadTabData = useCallback(async (tab: ExploreTab) => {
    if (tab === 'posts') { await loadPosts(true); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/explore?type=${tab === 'creators' ? 'users' : tab}`)
      const data = await res.json() as {
        surveys?: ExploreSurvey[]
        stories?: ExploreStory[]
        users?: ExploreUser[]
      }
      if (tab === 'surveys') setSurveys(data.surveys ?? [])
      if (tab === 'stories') setStories(data.stories ?? [])
      if (tab === 'creators') setCreators(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [loadPosts])

  useEffect(() => { loadTabData(activeTab) }, [activeTab, postTypeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPosts = (search || tagFilter)
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

  const TABS = [
    { key: 'posts' as ExploreTab, label: '貼文', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'surveys' as ExploreTab, label: '問卷', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { key: 'stories' as ExploreTab, label: '故事小卡', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'creators' as ExploreTab, label: '創作者', icon: <Users className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handlePostCreated} />
      )}

      {/* FAB — only on posts tab */}
      {activeTab === 'posts' && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <PenSquare className="w-6 h-6" />
        </button>
      )}

      {/* Stories */}
      <div className="border-b border-white/8">
        <StoryCircles />
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-b from-slate-900/80 to-slate-950 border-b border-white/8 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">探索社群</h1>
          <p className="text-white/35 text-sm">探索問卷 · 閱讀貼文 · 發現創作者</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? 'bg-amber-500/15 border border-amber-400/30 text-amber-300'
                    : 'text-white/45 hover:text-white/75 hover:bg-white/5'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); if (!e.target.value) applyTagFilter('') }}
                  placeholder="搜尋貼文、標籤..."
                  className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-sm text-white placeholder-white/30"
                />
              </div>
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setPostTypeFilter(c.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      postTypeFilter === c.key ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span>{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>
            {trendingTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
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
            {loading && posts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white/40">沒有找到相關貼文</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.map(post => <PostPreviewCard key={post.id} post={post} meId={meId} />)}
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
          </>
        )}

        {/* Surveys tab */}
        {activeTab === 'surveys' && (
          <>
            <p className="text-xs text-white/30 mb-4">探索熱門問卷，分享你的觀點</p>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : surveys.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-white/40">目前沒有公開問卷</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {surveys.map(s => <SurveyCard key={s.id} survey={s} />)}
              </div>
            )}
          </>
        )}

        {/* Stories tab */}
        {activeTab === 'stories' && (
          <>
            <p className="text-xs text-white/30 mb-4">來自填答者的故事小卡，每一張都是真實的一瞬間</p>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-white/40">還沒有人分享故事小卡</p>
                <p className="text-xs text-white/25 mt-1">填完問卷後可以生成並分享你的故事</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map(s => <StoryMiniCard key={s.responseId} story={s} />)}
              </div>
            )}
          </>
        )}

        {/* Creators tab */}
        {activeTab === 'creators' && (
          <>
            <p className="text-xs text-white/30 mb-4">追蹤有趣的創作者，訂閱他們的最新動態</p>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-white/40">還沒有創作者</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creators.map(u => <CreatorCard key={u.id} user={u} meId={meId} />)}
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

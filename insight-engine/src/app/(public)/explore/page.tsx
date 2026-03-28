'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, Users, BookOpen, Sparkles, Search } from 'lucide-react'
import { FollowButton } from '@/components/social/FollowButton'

// ─── Types ───
interface Survey {
  id: string; slug: string; title: string; subtitle: string
  tenantId: string; tenantName: string | null; responseCount: number; createdAt: string
}
interface Post {
  id: string; userId: string; displayName: string | null; avatarUrl: string | null
  type: string; title: string | null; content: string
  images: { url: string }[] | null; likesCount: number; commentsCount: number; createdAt: string
}
interface Story {
  responseId: string; surveyTitle: string; surveySlug: string
  tenantName: string | null; oneLiner: string | null; createdAt: string
}
interface Creator {
  id: string; displayName: string | null; avatarUrl: string | null
  postCount: number; followerCount: number
}

type Tab = 'surveys' | 'posts' | 'stories' | 'creators'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'surveys', label: '問卷', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'posts',   label: '貼文', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'stories', label: '故事', icon: <span className="text-sm">📖</span> },
  { key: 'creators',label: '創作者', icon: <Users className="w-4 h-4" /> },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function Avatar({ name, url, size = 8 }: { name: string | null; url: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/70 overflow-hidden shrink-0`
  if (url) return <img src={url} alt="" className={cls} style={{ width: `${size * 4}px`, height: `${size * 4}px`, borderRadius: '9999px', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div className={cls} style={{ width: `${size * 4}px`, height: `${size * 4}px`, borderRadius: '9999px', flexShrink: 0 }}>
      {(name ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('surveys')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<'popular' | 'new'>('popular')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null | undefined>(undefined)

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [creators, setCreators] = useState<Creator[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => setMeId(d?.userId ?? null))
      .catch(() => setMeId(null))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: tab, sort, page: String(page) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/explore?${params}`).catch(() => null)
    if (!res?.ok) { setLoading(false); return }
    const data = await res.json() as Record<string, unknown>
    if (tab === 'surveys') setSurveys((data.surveys as Survey[]) ?? [])
    if (tab === 'posts') setPosts((data.posts as Post[]) ?? [])
    if (tab === 'stories') setStories((data.stories as Story[]) ?? [])
    if (tab === 'creators') setCreators((data.users as Creator[]) ?? [])
    setLoading(false)
  }, [tab, sort, search, page])

  useEffect(() => { fetchData() }, [fetchData])

  const switchTab = (t: Tab) => { setTab(t); setPage(1); setSearch(''); setSearchInput('') }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sticky header */}
      <nav className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/80">探索</span>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <Link href="/wallet" className="hover:text-white/80 transition-colors">🪙</Link>
            {meId === undefined ? null : meId ? (
              <Link href={`/u/${meId}`} className="px-3 py-1 rounded-full bg-white/8 border border-white/15 text-white/70 hover:bg-white/12 transition-colors text-xs">
                我的主頁
              </Link>
            ) : (
              <Link href="/register" className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/30 transition-colors text-xs">
                免費註冊
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/6 max-w-2xl mx-auto px-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === t.key
                  ? 'text-amber-400 border-amber-400'
                  : 'text-white/40 border-transparent hover:text-white/70'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8 space-y-4"
        style={{ paddingBottom: 'calc(2rem + var(--bnav-h, 5rem))' }}>

        {/* Search + sort (surveys + posts only) */}
        {(tab === 'surveys' || tab === 'posts') && (
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={tab === 'surveys' ? '搜尋問卷...' : '搜尋貼文...'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
              <button type="submit" className="px-3 py-2 rounded-xl bg-white/8 border border-white/12 text-white/60 text-sm hover:bg-white/12 transition-colors">
                搜
              </button>
            </form>
            {tab === 'surveys' && (
              <div className="flex gap-1">
                {(['popular', 'new'] as const).map(s => (
                  <button key={s} onClick={() => { setSort(s); setPage(1) }}
                    className={`px-3 py-2 rounded-xl text-xs transition-colors border
                      ${sort === s ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/8 text-white/40 hover:text-white/60'}`}
                  >
                    {s === 'popular' ? '🔥' : '✨'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'surveys' && <SurveysGrid surveys={surveys} />}
            {tab === 'posts' && <PostsFeed posts={posts} meId={meId ?? null} />}
            {tab === 'stories' && <StoriesGrid stories={stories} />}
            {tab === 'creators' && <CreatorsList creators={creators} meId={meId ?? null} />}

            {/* Pagination */}
            {((tab === 'surveys' && surveys.length > 0) ||
              (tab === 'posts' && posts.length > 0) ||
              (tab === 'stories' && stories.length > 0) ||
              (tab === 'creators' && creators.length > 0)) && (
              <div className="flex justify-center gap-3 pt-2">
                {page > 1 && (
                  <button onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/70">
                    ← 上一頁
                  </button>
                )}
                <button onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/70">
                  下一頁 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Survey cards ───
function SurveysGrid({ surveys }: { surveys: Survey[] }) {
  if (surveys.length === 0) return <Empty icon="📋" text="還沒有公開問卷" />
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {surveys.map(s => (
        <Link key={s.id} href={`/${s.tenantId}/${s.slug}`}
          className="group block rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] p-4 space-y-2 transition-all hover:border-white/15">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {s.title}
            </h3>
            <span className="shrink-0 text-[10px] text-white/25 mt-0.5">{timeAgo(s.createdAt)}</span>
          </div>
          {s.subtitle && <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{s.subtitle}</p>}
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>👥 {s.responseCount.toLocaleString()} 人填過</span>
            {s.tenantName && <span className="bg-white/5 px-2 py-0.5 rounded-full">{s.tenantName}</span>}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Posts feed ───
function PostsFeed({ posts, meId }: { posts: Post[]; meId: string | null }) {
  if (posts.length === 0) return <Empty icon="✍️" text="還沒有公開貼文" />
  return (
    <div className="space-y-3">
      {posts.map(p => (
        <div key={p.id} className="bg-white/[0.03] border border-white/8 rounded-2xl hover:bg-white/[0.06] hover:border-white/14 transition-all">
          {/* Author row — not wrapped in Link so FollowButton works */}
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-0">
            <Link href={`/u/${p.userId}`} className="shrink-0">
              <Avatar name={p.displayName} url={p.avatarUrl} size={8} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${p.userId}`}>
                <p className="text-sm font-medium text-white/80 truncate hover:text-white transition-colors">{p.displayName ?? '用戶'}</p>
              </Link>
              <p className="text-[10px] text-white/30">{timeAgo(p.createdAt)}</p>
            </div>
            {meId && meId !== p.userId && (
              <FollowButton targetUserId={p.userId} initialFollowing={false} compact />
            )}
          </div>
          {/* Post content */}
          <Link href={`/articles/${p.id}`} className="block px-4 pt-3 pb-4 space-y-2">
            {p.title && <p className="font-semibold text-white/90 text-sm line-clamp-1">{p.title}</p>}
            <p className="text-sm text-white/55 leading-relaxed line-clamp-3">{p.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
            {p.images?.[0] && (
              <img src={p.images[0].url} alt="" className="w-full h-40 object-cover rounded-xl" />
            )}
            <div className="flex items-center gap-4 text-xs text-white/25">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{p.likesCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p.commentsCount}</span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

// ─── Story cards ───
function StoriesGrid({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return <Empty icon="📖" text="還沒有公開故事" />
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {stories.map(s => (
        <Link key={s.responseId} href={`/story/${s.responseId}`}
          className="group block rounded-2xl border border-purple-500/15 bg-purple-500/5 hover:bg-purple-500/10 p-4 space-y-2.5 transition-all hover:border-purple-400/25">
          <div className="text-xs text-purple-300/60 font-medium">{s.tenantName ?? s.surveyTitle}</div>
          <p className="text-sm text-white/80 leading-relaxed italic line-clamp-3">「{s.oneLiner}」</p>
          <p className="text-[10px] text-white/25">{timeAgo(s.createdAt)}</p>
        </Link>
      ))}
    </div>
  )
}

// ─── Creators ───
function CreatorsList({ creators, meId }: { creators: Creator[]; meId: string | null }) {
  if (creators.length === 0) return <Empty icon="👤" text="還沒有創作者" />
  return (
    <div className="space-y-2">
      {creators.map(c => (
        <div key={c.id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/8 rounded-2xl hover:bg-white/[0.06] transition-all">
          <Link href={`/u/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar name={c.displayName} url={c.avatarUrl} size={10} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/85 truncate">{c.displayName ?? '用戶'}</p>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/35">
                <span>👥 {c.followerCount} 粉絲</span>
                <span>✍️ {c.postCount} 貼文</span>
              </div>
            </div>
          </Link>
          {meId && meId !== c.id && (
            <FollowButton targetUserId={c.id} initialFollowing={false} compact />
          )}
        </div>
      ))}
    </div>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-3xl">{icon}</p>
      <p className="text-white/30 text-sm">{text}</p>
    </div>
  )
}

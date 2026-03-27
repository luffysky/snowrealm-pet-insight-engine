'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Eye, EyeOff, Flag, Play, Image as ImageIcon, FileText, Search } from 'lucide-react'
import type { SocialPost } from '@/lib/socialEngine'

type FilterType = '' | 'post' | 'article'

export default function AdminSocialPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const LIMIT = 20

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const off = reset ? 0 : offset
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/admin/social/posts?${params}`)
      const data = await res.json() as { posts: SocialPost[] }
      const fetched = data.posts ?? []
      setPosts(prev => reset ? fetched : [...prev, ...fetched])
      setOffset(off + LIMIT)
      setHasMore(fetched.length === LIMIT)
    } finally {
      setLoading(false)
    }
  }, [offset, typeFilter])

  useEffect(() => { load(true) }, [typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這則貼文？此操作無法復原。')) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/social/posts/${id}`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublic(post: SocialPost) {
    setToggling(post.id)
    try {
      const res = await fetch(`/api/admin/social/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !post.isPublic }),
      })
      const data = await res.json() as { post?: SocialPost }
      if (data.post) setPosts(prev => prev.map(p => p.id === post.id ? data.post! : p))
    } finally {
      setToggling(null)
    }
  }

  const filtered = search
    ? posts.filter(p =>
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        (p.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.authorName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : posts

  const stats = {
    total: posts.length,
    articles: posts.filter(p => p.type === 'article').length,
    withVideo: posts.filter(p => p.videoUrl).length,
    hidden: posts.filter(p => !p.isPublic).length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">社群貼文管理</h1>
          <p className="text-sm text-white/40 mt-0.5">審核、隱藏或刪除社群貼文</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '全部貼文', value: stats.total, icon: '📝' },
          { label: '長文章', value: stats.articles, icon: '📖' },
          { label: '含影片', value: stats.withVideo, icon: '🎬' },
          { label: '已隱藏', value: stats.hidden, icon: '🙈' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋貼文內容、作者..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <div className="flex gap-2">
          {([['', '全部'], ['post', '短貼文'], ['article', '長文章']] as [FilterType, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === k ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
        {loading && posts.length === 0 ? (
          <div className="p-8 text-center text-white/30">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/30">沒有貼文</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(post => (
              <PostRow
                key={post.id}
                post={post}
                onDelete={() => handleDelete(post.id)}
                onTogglePublic={() => handleTogglePublic(post)}
                deleting={deleting === post.id}
                toggling={toggling === post.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !search && (
        <div className="flex justify-center">
          <button onClick={() => load(false)} disabled={loading}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loading ? '載入中...' : '載入更多'}
          </button>
        </div>
      )}
    </div>
  )
}

interface PostRowProps {
  post: SocialPost
  onDelete: () => void
  onTogglePublic: () => void
  deleting: boolean
  toggling: boolean
}

function PostRow({ post, onDelete, onTogglePublic, deleting, toggling }: PostRowProps) {
  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()

  const contentPreview = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '')

  return (
    <div className={`p-4 flex gap-3 hover:bg-white/[0.02] transition-colors ${!post.isPublic ? 'opacity-50' : ''}`}>
      {/* Author avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden shrink-0">
        {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white/80">{post.authorName ?? '用戶'}</span>
          <span className="text-xs text-white/30">{timeStr}</span>
          {post.type === 'article' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full flex items-center gap-0.5">
              <FileText className="w-2.5 h-2.5" /> 文章
            </span>
          )}
          {post.videoUrl && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-full flex items-center gap-0.5">
              <Play className="w-2.5 h-2.5" /> 影片
            </span>
          )}
          {post.images.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-0.5">
              <ImageIcon className="w-2.5 h-2.5" /> {post.images.length}圖
            </span>
          )}
          {!post.isPublic && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full">已隱藏</span>
          )}
        </div>

        {post.title && (
          <p className="text-sm font-semibold text-white/90 mb-0.5 truncate">{post.title}</p>
        )}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{contentPreview}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.tags.slice(0, 4).map(t => (
              <span key={t} className="text-[10px] text-amber-400/50">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/25">
          <span>❤️ {post.likesCount}</span>
          <span>💬 {post.commentsCount}</span>
          <span>👁 {post.viewsCount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 shrink-0">
        <a href={`/articles/${post.id}`} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="查看貼文"
        >
          <Eye className="w-4 h-4" />
        </a>
        <button
          onClick={onTogglePublic}
          disabled={toggling}
          className={`p-1.5 rounded-lg transition-colors ${
            post.isPublic
              ? 'text-white/30 hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-amber-400 hover:text-white/50 hover:bg-white/5'
          }`}
          title={post.isPublic ? '隱藏貼文' : '公開貼文'}
        >
          {toggling ? (
            <span className="w-4 h-4 border border-white/30 border-t-white/60 rounded-full animate-spin block" />
          ) : post.isPublic ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Flag className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="刪除貼文"
        >
          {deleting ? (
            <span className="w-4 h-4 border border-red-400/30 border-t-red-400/60 rounded-full animate-spin block" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

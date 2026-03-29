'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Eye, EyeOff, Flag, Play, Image as ImageIcon, FileText, Search, BookOpen } from 'lucide-react'
import type { SocialPost, PostImage } from '@/lib/socialEngine'

type FilterType = '' | 'post' | 'article' | 'blog'

interface BlogArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  tags: string[]
  is_public: boolean
  view_count: number
  published_at: string
  created_at: string
}

interface DisplayItem {
  id: string
  source: 'social' | 'blog'
  type: 'post' | 'article' | 'blog'
  title: string | null
  contentPreview: string
  authorName: string | null
  authorAvatar: string | null
  isPublic: boolean
  tags: string[]
  images: PostImage[]
  videoUrl: string | null
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  slug?: string
}

function socialToDisplay(p: SocialPost): DisplayItem {
  return {
    id: p.id,
    source: 'social',
    type: p.type === 'article' ? 'article' : 'post',
    title: p.title ?? null,
    contentPreview: p.content.replace(/<[^>]*>/g, '').slice(0, 120),
    authorName: p.authorName ?? null,
    authorAvatar: p.authorAvatar ?? null,
    isPublic: p.isPublic,
    tags: p.tags,
    images: p.images,
    videoUrl: p.videoUrl ?? null,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    viewsCount: p.viewsCount,
    createdAt: p.createdAt,
  }
}

function blogToDisplay(a: BlogArticle): DisplayItem {
  return {
    id: a.id,
    source: 'blog',
    type: 'blog',
    title: a.title,
    contentPreview: (a.summary ?? a.content.replace(/<[^>]*>/g, '')).slice(0, 120),
    authorName: null,
    authorAvatar: null,
    isPublic: a.is_public,
    tags: a.tags ?? [],
    images: [],
    videoUrl: null,
    likesCount: 0,
    commentsCount: 0,
    viewsCount: a.view_count,
    createdAt: a.published_at ?? a.created_at,
    slug: a.slug,
  }
}

export default function AdminSocialPostsPage() {
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const LIMIT = 20

  const loadSocial = useCallback(async (reset = false) => {
    const off = reset ? 0 : offset
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
    if (typeFilter === 'post' || typeFilter === 'article') params.set('type', typeFilter)
    const res = await fetch(`/api/admin/social/posts?${params}`)
    const data = await res.json() as { posts: SocialPost[] }
    const fetched = data.posts ?? []
    setSocialPosts(prev => reset ? fetched : [...prev, ...fetched])
    setOffset(off + LIMIT)
    setHasMore(fetched.length === LIMIT)
  }, [offset, typeFilter])

  const loadBlog = useCallback(async () => {
    const res = await fetch('/api/admin/social/blog')
    const data = await res.json() as { articles: BlogArticle[] }
    setBlogArticles(data.articles ?? [])
  }, [])

  useEffect(() => {
    setLoading(true)
    const fetches: Promise<void>[] = []

    if (typeFilter !== 'blog') fetches.push(loadSocial(true))
    else setSocialPosts([])

    if (typeFilter === '' || typeFilter === 'blog') fetches.push(loadBlog())

    Promise.all(fetches).finally(() => setLoading(false))
  }, [typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(item: DisplayItem) {
    if (!confirm('確定要刪除？此操作無法復原。')) return
    setDeleting(item.id)
    try {
      if (item.source === 'blog') {
        await fetch(`/api/admin/social/blog/${item.id}`, { method: 'DELETE' })
        setBlogArticles(prev => prev.filter(a => a.id !== item.id))
      } else {
        await fetch(`/api/admin/social/posts/${item.id}`, { method: 'DELETE' })
        setSocialPosts(prev => prev.filter(p => p.id !== item.id))
      }
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublic(item: DisplayItem) {
    setToggling(item.id)
    try {
      if (item.source === 'blog') {
        const res = await fetch(`/api/admin/social/blog/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: !item.isPublic }),
        })
        const data = await res.json() as { article?: BlogArticle }
        if (data.article) {
          setBlogArticles(prev => prev.map(a => a.id === item.id ? data.article! : a))
        }
      } else {
        const res = await fetch(`/api/admin/social/posts/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: !item.isPublic }),
        })
        const data = await res.json() as { post?: SocialPost }
        if (data.post) setSocialPosts(prev => prev.map(p => p.id === item.id ? data.post! : p))
      }
    } finally {
      setToggling(null)
    }
  }

  // Build unified display list based on filter
  const allItems: DisplayItem[] = [
    ...(typeFilter !== 'blog' ? socialPosts.map(socialToDisplay) : []),
    ...(typeFilter === '' || typeFilter === 'blog' ? blogArticles.map(blogToDisplay) : []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = search
    ? allItems.filter(item =>
        item.contentPreview.toLowerCase().includes(search.toLowerCase()) ||
        (item.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.authorName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allItems

  const stats = {
    social: socialPosts.length,
    blog: blogArticles.length,
    articles: socialPosts.filter(p => p.type === 'article').length,
    hidden: [
      ...socialPosts.filter(p => !p.isPublic),
      ...blogArticles.filter(a => !a.is_public),
    ].length,
  }

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#3d3155]">社群貼文管理</h1>
          <p className="text-sm text-[#6b5fa8] mt-0.5">管理社群貼文與部落格文章</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '社群貼文', value: stats.social, icon: '📝' },
          { label: '社群長文章', value: stats.articles, icon: '📖' },
          { label: '部落格文章', value: stats.blog, icon: '✍️' },
          { label: '已隱藏', value: stats.hidden, icon: '🙈' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-xl font-bold text-[#3d3155]">{s.value}</p>
            <p className="text-xs text-[#6b5fa8]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7ca8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋內容、標題、作者..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-[#3d3155] placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {([
            ['', '全部'],
            ['post', '短貼文'],
            ['article', '長文章'],
            ['blog', '部落格'],
          ] as [FilterType, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === k
                  ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-[#6b5fa8] hover:text-[#3d3155]'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white/[0.03] border border-white/8 rounded-[20px] overflow-hidden">
        {loading && allItems.length === 0 ? (
          <div className="p-8 text-center text-[#8a7ca8]">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8a7ca8]">沒有內容</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(item => (
              <ItemRow
                key={`${item.source}-${item.id}`}
                item={item}
                onDelete={() => handleDelete(item)}
                onTogglePublic={() => handleTogglePublic(item)}
                deleting={deleting === item.id}
                toggling={toggling === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more (social only, not for blog-only filter) */}
      {hasMore && !search && typeFilter !== 'blog' && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setLoading(true)
              loadSocial(false).finally(() => setLoading(false))
            }}
            disabled={loading}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-[#8a7ca8] hover:text-[#3d3155] hover:bg-[#b8a9e8]/12 transition-colors disabled:opacity-50"
          >
            {loading ? '載入中...' : '載入更多'}
          </button>
        </div>
      )}
    </div>
  )
}

interface ItemRowProps {
  item: DisplayItem
  onDelete: () => void
  onTogglePublic: () => void
  deleting: boolean
  toggling: boolean
}

function ItemRow({ item, onDelete, onTogglePublic, deleting, toggling }: ItemRowProps) {
  const timeStr = new Date(item.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const initials = item.source === 'blog' ? '✍' : (item.authorName ?? '?').slice(0, 2).toUpperCase()

  const viewUrl = item.source === 'blog'
    ? `/blogs/${item.slug ?? item.id}`
    : `/articles/${item.id}`

  const editUrl = item.source === 'blog'
    ? `/insight-admin/blog?article=${item.id}`
    : null

  return (
    <div className={`p-4 flex gap-3 hover:bg-white/[0.02] transition-colors ${!item.isPublic ? 'opacity-50' : ''}`}>
      {/* Avatar / icon */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-[#3d3155] overflow-hidden shrink-0">
        {item.authorAvatar
          ? <img src={item.authorAvatar} alt="" className="w-full h-full object-cover" />
          : initials
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {item.authorName && (
            <span className="text-sm font-medium text-[#3d3155]">{item.authorName}</span>
          )}
          <span className="text-xs text-[#8a7ca8]">{timeStr}</span>

          {item.source === 'blog' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full flex items-center gap-0.5">
              <BookOpen className="w-2.5 h-2.5" /> 部落格
            </span>
          )}
          {item.type === 'article' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full flex items-center gap-0.5">
              <FileText className="w-2.5 h-2.5" /> 長文章
            </span>
          )}
          {item.videoUrl && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-full flex items-center gap-0.5">
              <Play className="w-2.5 h-2.5" /> 影片
            </span>
          )}
          {item.images.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-0.5">
              <ImageIcon className="w-2.5 h-2.5" /> {item.images.length}圖
            </span>
          )}
          {!item.isPublic && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full">已隱藏</span>
          )}
        </div>

        {item.title && (
          <p className="text-sm font-semibold text-[#3d3155]/90 mb-0.5 truncate">{item.title}</p>
        )}
        <p className="text-xs text-[#6b5fa8] leading-relaxed line-clamp-2">{item.contentPreview}</p>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 4).map(t => (
              <span key={t} className="text-[10px] text-amber-700">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6b5fa8]">
          {item.source === 'social' ? (
            <>
              <span>❤️ {item.likesCount}</span>
              <span>💬 {item.commentsCount}</span>
              <span>👁 {item.viewsCount}</span>
            </>
          ) : (
            <span>👁 {item.viewsCount} 次閱讀</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 shrink-0">
        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-[#8a7ca8] hover:text-[#3d3155] hover:bg-[#b8a9e8]/10 transition-colors"
          title="查看"
        >
          <Eye className="w-4 h-4" />
        </a>
        {editUrl && (
          <a href={editUrl}
            className="p-1.5 rounded-lg text-[#8a7ca8] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="編輯文章"
          >
            <FileText className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onTogglePublic}
          disabled={toggling}
          className={`p-1.5 rounded-lg transition-colors ${
            item.isPublic
              ? 'text-[#8a7ca8] hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-amber-400 hover:text-[#6b5fa8] hover:bg-[#b8a9e8]/10'
          }`}
          title={item.isPublic ? '隱藏' : '公開'}
        >
          {toggling ? (
            <span className="w-4 h-4 border border-white/30 border-t-white/60 rounded-full animate-spin block" />
          ) : item.isPublic ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Flag className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-[#8a7ca8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="刪除"
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

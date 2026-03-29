'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, FileText, MessageSquare, Users, Flag, Trash2, CheckCircle, XCircle, Clock, Eye, RefreshCw, Ban, UserCheck, Activity, Image as ImageIcon, BookOpen } from 'lucide-react'

type Tab = 'reports' | 'posts' | 'albums' | 'blogs' | 'dms' | 'users'

interface Stats {
  totalPosts: number
  totalDms: number
  totalUsers: number
  pendingReports: number
  totalAlbumPhotos: number
  totalBlogs: number
  totalAlbums: number
}

interface Album {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  photo_count: string
  created_at: string
  updated_at: string | null
}

interface AlbumPhoto {
  id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

interface BlogArticle {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  is_public: boolean
  view_count: number
  tags: string[]
  published_at: string
}

interface Report {
  id: string
  reporter_name: string | null
  target_type: string
  target_id: string
  target_content: string | null
  target_author_name: string | null
  reason: string
  description: string | null
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

interface Post {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  type: string
  title: string | null
  content: string
  images: { url: string; alt?: string }[]
  tags: string[]
  is_public: boolean
  created_at: string
  likes_count: number
  comments_count: number
}

interface DmConversation {
  user1Id: string
  user2Id: string
  user1Name: string
  user2Name: string
  user1Avatar: string | null
  user2Avatar: string | null
  messageCount: number
  lastAt: string
  lastContent: string
}

interface DmMessage {
  id: string
  fromUserId: string
  toUserId: string
  fromName: string
  toName: string
  content: string
  createdAt: string
}

interface User {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  tenant_id: string | null
  is_banned?: boolean
  ban_reason?: string | null
}

/** 解析 DM content，渲染媒體而不是原始文字 */
function renderDmContent(content: string) {
  if (content === '[已收回]') return <span className="text-white/30 italic text-xs">（訊息已收回）</span>

  // image
  const imgMatch = content.match(/^\[img:(https?:\/\/[^\]]+)\]$/)
  if (imgMatch) return (
    <a href={imgMatch[1]} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgMatch[1]} alt="圖片" className="max-h-48 max-w-xs rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" />
    </a>
  )

  // gif
  const gifMatch = content.match(/^\[gif:(https?:\/\/[^\]]+)\]$/)
  if (gifMatch) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={gifMatch[1]} alt="GIF" className="max-h-40 max-w-xs rounded-xl" />
  )

  // video
  const videoMatch = content.match(/^\[video:(https?:\/\/[^\]]+)\]$/)
  if (videoMatch) return (
    <video src={videoMatch[1]} controls className="max-h-48 max-w-xs rounded-xl" preload="metadata" />
  )

  // audio
  const audioMatch = content.match(/^\[audio:(https?:\/\/[^\]]+)\]$/)
  if (audioMatch) return (
    <audio src={audioMatch[1]} controls className="w-full max-w-xs" />
  )

  // file — format: [file:name|url] (pipe separator)
  const fileMatch = content.match(/^\[file:([^\|]+)\|(https?:\/\/[^\]]+)\]$/)
  if (fileMatch) return (
    <a href={fileMatch[2]} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-blue-300 hover:text-blue-200 hover:bg-white/10 transition-colors"
    >
      📎 {fileMatch[1]}
    </a>
  )

  // plain text
  return <span className="text-sm text-white/70 whitespace-pre-wrap break-words">{content}</span>
}

const REASON_LABELS: Record<string, string> = {
  spam: '🗑️ 垃圾訊息', fraud: '🚨 詐騙', harassment: '😡 騷擾/霸凌',
  inappropriate: '🔞 不當內容', violence: '⚔️ 暴力',
  privacy: '🔏 侵犯隱私', copyright: '©️ 著作權', other: '❓ 其他',
}

const STATUS_CONFIG = {
  pending:   { label: '待審查', color: 'text-amber-400 bg-amber-500/10 border-amber-400/20', icon: Clock },
  reviewing: { label: '審查中', color: 'text-blue-400 bg-blue-500/10 border-blue-400/20', icon: Eye },
  resolved:  { label: '已處理', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20', icon: CheckCircle },
  dismissed: { label: '已駁回', color: 'text-white/30 bg-white/5 border-white/10', icon: XCircle },
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof Flag; text: string }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

const AUTO_REFRESH_INTERVAL = 30_000 // 30 秒

export default function SocialMonitorPage() {
  const [tab, setTab] = useState<Tab>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [blogs, setBlogs] = useState<BlogArticle[]>([])
  const [dms, setDms] = useState<DmConversation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [expandedConv, setExpandedConv] = useState<{ u1: string; u2: string } | null>(null)
  const [convMessages, setConvMessages] = useState<DmMessage[]>([])
  const [convLoading, setConvLoading] = useState(false)
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null)
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([])
  const [albumPhotosLoading, setAlbumPhotosLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/social?tab=stats')
      if (!res.ok) return
      const data = await res.json() as { stats?: Stats }
      if (data.stats) setStats(data.stats)
    } catch {}
  }, [])

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/social?tab=${t}`)
      if (!res.ok) return
      const data = await res.json() as { reports?: Report[]; posts?: Post[]; albums?: Album[]; blogs?: BlogArticle[]; dms?: DmConversation[]; users?: User[] }
      if (data.reports) setReports(data.reports)
      if (data.posts) setPosts(data.posts)
      if (data.albums) setAlbums(data.albums)
      if (data.blogs) setBlogs(data.blogs)
      if (data.dms) setDms(data.dms)
      if (data.users) setUsers(data.users)
      setLastRefreshed(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + tab change
  useEffect(() => {
    fetchData(tab)
    fetchStats()
  }, [tab, fetchData, fetchStats])

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchData(tab)
      fetchStats()
    }, AUTO_REFRESH_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [tab, fetchData, fetchStats])

  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed' | 'reviewing') => {
    await fetch('/api/super-admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status, reviewNote }),
    })
    setSelectedReport(null)
    setReviewNote('')
    fetchData('reports')
    fetchStats()
  }

  const handleBan = async (userId: string, action: 'ban' | 'unban', reason?: string) => {
    if (action === 'ban' && !confirm(`確定要封禁此用戶？\n原因：${reason || '違反社群規範'}`)) return
    await fetch('/api/super-admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, reason }),
    })
    fetchData('users')
    fetchStats()
  }

  const loadAlbumPhotos = async (albumId: string) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null)
      setAlbumPhotos([])
      return
    }
    setExpandedAlbum(albumId)
    setAlbumPhotosLoading(true)
    try {
      const res = await fetch(`/api/super-admin/social?tab=album_detail&albumId=${albumId}`)
      if (res.ok) {
        const data = await res.json() as { photos?: AlbumPhoto[] }
        setAlbumPhotos(data.photos ?? [])
      }
    } finally {
      setAlbumPhotosLoading(false)
    }
  }

  const loadConvMessages = async (u1: string, u2: string) => {
    if (expandedConv?.u1 === u1 && expandedConv?.u2 === u2) {
      setExpandedConv(null)
      setConvMessages([])
      return
    }
    setExpandedConv({ u1, u2 })
    setConvLoading(true)
    try {
      const res = await fetch(`/api/super-admin/social?tab=dm_detail&u1=${u1}&u2=${u2}`)
      if (res.ok) {
        const data = await res.json() as { messages?: DmMessage[] }
        setConvMessages(data.messages ?? [])
      }
    } finally {
      setConvLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('確定刪除此貼文？此操作無法復原。')) return
    await fetch('/api/super-admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletePostId: postId }),
    })
    fetchData('posts')
    fetchStats()
  }

  const handleDeleteAlbum = async (albumId: string, name: string) => {
    if (!confirm(`確定刪除相簿「${name}」及其所有照片？此操作無法復原。`)) return
    await fetch('/api/super-admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteAlbumId: albumId }),
    })
    fetchData('albums')
    fetchStats()
  }

  const handleDeleteBlog = async (blogId: string, title: string) => {
    if (!confirm(`確定刪除文章「${title}」？此操作無法復原。`)) return
    await fetch('/api/super-admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteBlogId: blogId }),
    })
    fetchData('blogs')
    fetchStats()
  }

  const pendingCount = stats?.pendingReports ?? reports.filter(r => r.status === 'pending').length

  const TABS: { key: Tab; label: string; icon: typeof Flag; count?: number }[] = [
    { key: 'reports', label: '檢舉', icon: Flag, count: pendingCount || undefined },
    { key: 'posts', label: '貼文', icon: FileText, count: stats?.totalPosts || undefined },
    { key: 'albums', label: '相簿', icon: ImageIcon, count: stats?.totalAlbums || undefined },
    { key: 'blogs', label: '部落格', icon: BookOpen, count: stats?.totalBlogs || undefined },
    { key: 'dms', label: '私訊', icon: MessageSquare, count: stats?.totalDms || undefined },
    { key: 'users', label: '用戶', icon: Users, count: stats?.totalUsers || undefined },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-red-400" />
        <div>
          <h1 className="text-xl font-bold text-white">社群監控中心</h1>
          <p className="text-xs text-slate-400">全平台貼文、私訊、用戶、檢舉即時監控（自動每 30 秒刷新）</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-white/30 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              {lastRefreshed.toLocaleTimeString('zh-TW')}
            </span>
          )}
          <button
            onClick={() => { fetchData(tab); fetchStats() }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: '待審檢舉', value: stats.pendingReports, color: 'text-red-400', icon: Flag },
            { label: '貼文', value: stats.totalPosts, color: 'text-blue-400', icon: FileText },
            { label: '相簿', value: stats.totalAlbums ?? 0, color: 'text-pink-300', icon: ImageIcon },
            { label: '相簿照片', value: stats.totalAlbumPhotos, color: 'text-pink-400', icon: ImageIcon },
            { label: '部落格文章', value: stats.totalBlogs, color: 'text-amber-400', icon: BookOpen },
            { label: '私訊對話', value: stats.totalDms, color: 'text-purple-400', icon: MessageSquare },
            { label: '用戶', value: stats.totalUsers, color: 'text-emerald-400', icon: Users },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count ? (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                  t.key === 'reports' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {t.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && reports.length === 0 && <EmptyState icon={Flag} text="目前沒有檢舉記錄" />}
          {reports.map(r => (
            <div key={r.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge status={r.status} />
                    <span className="text-xs text-white/50">{new Date(r.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="text-red-400 font-medium">{REASON_LABELS[r.reason] ?? r.reason}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">
                      {r.target_type === 'post' ? '📝 貼文' : r.target_type === 'comment' ? '💬 留言' : r.target_type === 'message' ? '✉️ 私訊' : '👤 用戶'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    舉報人：<span className="text-white/70">{r.reporter_name ?? '匿名'}</span>
                    {r.target_author_name && (
                      <> · 被舉報：<span className="text-white/70">{r.target_author_name}</span></>
                    )}
                  </p>
                  {r.target_content && (
                    <div className="mt-2 bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/50">
                      {renderDmContent(r.target_content)}
                    </div>
                  )}
                  {r.description && (
                    <p className="mt-1 text-xs text-white/40 italic">「{r.description}」</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { setSelectedReport(r); setReviewNote('') }}
                        className="px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        審查
                      </button>
                      <button
                        onClick={() => handleReportAction(r.id, 'dismissed')}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs hover:text-white/60 transition-colors"
                      >
                        駁回
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts Tab — ALL posts regardless of report status */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && posts.length === 0 && <EmptyState icon={FileText} text="目前沒有貼文" />}
          {posts.map(p => (
            <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.type === 'article' ? 'text-blue-400 bg-blue-500/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10'}`}>
                      {p.type === 'article' ? '📄 文章' : '📝 貼文'}
                    </span>
                    {!p.is_public && <span className="text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">私密</span>}
                    <span className="text-xs text-white/40">{new Date(p.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                  <p className="text-sm font-medium text-white/80 mb-1">
                    {p.author_name ?? '未知用戶'}
                    {p.title && <span className="ml-2 text-amber-300">「{p.title}」</span>}
                  </p>
                  <p className="text-xs text-white/50 line-clamp-2">
                    {p.content.replace(/<[^>]+>/g, ' ').slice(0, 200)}
                  </p>
                  {p.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {p.images.slice(0, 4).map((img, i) => (
                        <img key={i} src={img.url} alt="" className="w-14 h-14 object-cover rounded-lg" />
                      ))}
                      {p.images.length > 4 && <span className="text-xs text-white/30 self-center">+{p.images.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex gap-3 mt-1.5 text-xs text-white/30">
                    <span>❤️ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
                    {p.tags.length > 0 && <span className="text-amber-400/50">#{p.tags.slice(0, 2).join(' #')}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Albums Tab — grouped by user, expandable photo grid */}
      {tab === 'albums' && (
        <div className="space-y-3">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && albums.length === 0 && <EmptyState icon={ImageIcon} text="目前沒有相簿" />}
          {(() => {
            const byUser = albums.reduce<Record<string, { name: string | null; avatar: string | null; items: Album[] }>>((acc, a) => {
              const key = a.user_id
              if (!acc[key]) acc[key] = { name: a.author_name, avatar: a.author_avatar, items: [] }
              acc[key].items.push(a)
              return acc
            }, {})
            return Object.entries(byUser).map(([userId, group]) => (
              <div key={userId} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/70 overflow-hidden shrink-0">
                    {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : (group.name ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80">{group.name ?? '未知用戶'}</span>
                  <span className="text-xs text-white/30 ml-auto">{group.items.length} 個相簿</span>
                </div>
                <div className="divide-y divide-slate-700/20">
                  {group.items.map(album => {
                    const isAlbumExpanded = expandedAlbum === album.id
                    return (
                      <div key={album.id}>
                        {/* Album header row */}
                        <div className="px-4 py-2.5 flex items-center gap-3">
                          {album.cover_image ? (
                            <img src={album.cover_image} alt="" className="w-10 h-8 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="w-10 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-pink-400/40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-white/75">{album.name}</span>
                              {!album.is_public && <span className="text-[10px] text-orange-400/70 bg-orange-500/10 border border-orange-400/20 rounded-full px-1.5 py-0.5">🔒 私密</span>}
                              <span className="text-xs text-white/30">{album.photo_count} 張</span>
                            </div>
                            {album.description && <p className="text-xs text-white/35 truncate mt-0.5">{album.description}</p>}
                          </div>
                          <span className="text-xs text-white/25 shrink-0">{new Date(album.created_at).toLocaleDateString('zh-TW')}</span>
                          <button
                            onClick={() => void loadAlbumPhotos(album.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${isAlbumExpanded ? 'bg-pink-500/20 border border-pink-400/30 text-pink-300' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'}`}
                            title={isAlbumExpanded ? '收起' : '展開照片'}
                          >
                            {isAlbumExpanded ? '▲ 收起' : '▼ 看照片'}
                          </button>
                          <button
                            onClick={() => void handleDeleteAlbum(album.id, album.name)}
                            className="p-1 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                            title="刪除相簿"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Expanded photo grid */}
                        {isAlbumExpanded && (
                          <div className="border-t border-white/5 bg-black/20 px-4 py-3">
                            {albumPhotosLoading ? (
                              <p className="text-xs text-white/30 text-center py-4">載入照片中...</p>
                            ) : albumPhotos.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-4">相簿內沒有照片</p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {albumPhotos.map((photo, idx) => (
                                  <a
                                    key={photo.id}
                                    href={photo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-pink-400/30 transition-colors"
                                    title={photo.caption ?? `照片 ${idx + 1}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={photo.url}
                                      alt={photo.caption ?? ''}
                                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                    />
                                    {!photo.is_public && (
                                      <span className="absolute top-1 right-1 text-[9px] bg-black/70 text-orange-300 rounded px-1">🔒</span>
                                    )}
                                    {photo.caption && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white/80 line-clamp-2">{photo.caption}</p>
                                      </div>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* Blogs Tab — grouped by user */}
      {tab === 'blogs' && (
        <div className="space-y-3">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && blogs.length === 0 && <EmptyState icon={BookOpen} text="目前沒有部落格文章" />}
          {(() => {
            const byUser = blogs.reduce<Record<string, { name: string | null; avatar: string | null; items: BlogArticle[] }>>((acc, b) => {
              const key = b.user_id
              if (!acc[key]) acc[key] = { name: b.author_name, avatar: b.author_avatar, items: [] }
              acc[key].items.push(b)
              return acc
            }, {})
            return Object.entries(byUser).map(([userId, group]) => (
              <div key={userId} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-xs font-bold text-white/70 overflow-hidden shrink-0">
                    {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : (group.name ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80">{group.name ?? '未知用戶'}</span>
                  <span className="text-xs text-white/30 ml-auto">{group.items.length} 篇文章</span>
                </div>
                <div className="divide-y divide-slate-700/20">
                  {group.items.map(article => (
                    <div key={article.id} className="px-4 py-3 flex items-start gap-3">
                      {article.cover_image && (
                        <img src={article.cover_image} alt="" className="w-14 h-10 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-medium text-white/80 truncate">{article.title}</span>
                          {!article.is_public && <span className="text-[10px] text-white/25 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5 shrink-0">私密</span>}
                        </div>
                        {article.summary && <p className="text-xs text-white/40 line-clamp-1">{article.summary}</p>}
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-white/25">
                          <span>👁 {article.view_count}</span>
                          {article.tags.length > 0 && <span className="text-amber-400/40">#{article.tags.slice(0, 2).join(' #')}</span>}
                          <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleDeleteBlog(article.id, article.title)}
                        className="p-1 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                        title="刪除文章"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* DMs Tab — Grouped by conversation */}
      {tab === 'dms' && (
        <div className="space-y-2">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && dms.length === 0 && <EmptyState icon={MessageSquare} text="目前沒有私訊記錄" />}
          {dms.map(conv => {
            const isExpanded = expandedConv?.u1 === conv.user1Id && expandedConv?.u2 === conv.user2Id
            return (
              <div key={`${conv.user1Id}_${conv.user2Id}`} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* Conversation header row */}
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  onClick={() => loadConvMessages(conv.user1Id, conv.user2Id)}
                >
                  {/* User avatars stacked */}
                  <div className="relative shrink-0 w-10 h-10">
                    <div className="absolute top-0 left-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/40 to-purple-500/40 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-white/70 overflow-hidden">
                      {conv.user1Avatar ? <img src={conv.user1Avatar} alt="" className="w-full h-full object-cover" /> : conv.user1Name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-br from-sky-500/40 to-emerald-500/40 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-white/70 overflow-hidden">
                      {conv.user2Avatar ? <img src={conv.user2Avatar} alt="" className="w-full h-full object-cover" /> : conv.user2Name.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium text-white/80">{conv.user1Name}</span>
                      <span className="text-white/30 text-xs">↔</span>
                      <span className="text-sm font-medium text-white/80">{conv.user2Name}</span>
                      <span className="ml-auto text-[10px] text-white/30 bg-white/8 px-1.5 py-0.5 rounded-full shrink-0">{conv.messageCount} 則</span>
                    </div>
                    <p className="text-xs text-white/35 truncate">{conv.lastContent.startsWith('[') ? '📎 媒體' : conv.lastContent.slice(0, 60)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-white/25">{new Date(conv.lastAt).toLocaleDateString('zh-TW')}</span>
                    <span className={`text-[10px] text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Expanded message thread */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
                    {convLoading ? (
                      <p className="text-xs text-white/30 text-center py-3">載入中...</p>
                    ) : (
                      convMessages.map(msg => (
                        <div key={msg.id} className="flex gap-2">
                          <span className="text-[10px] text-white/50 shrink-0 font-medium">{msg.fromName}:</span>
                          <div className="flex-1 min-w-0">
                            {renderDmContent(msg.content)}
                            <span className="text-[9px] text-white/20 block mt-0.5">{new Date(msg.createdAt).toLocaleString('zh-TW')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Users Tab — ALL users */}
      {tab === 'users' && (
        <div className="space-y-2">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && users.length === 0 && <EmptyState icon={Users} text="目前沒有用戶資料" />}
          {users.map(u => (
            <div key={u.id} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${u.is_banned ? 'bg-red-500/5 border-red-400/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name ?? u.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${u.is_banned ? 'text-red-400/70 line-through' : 'text-white/80'}`}>{u.display_name ?? u.username}</p>
                  {u.is_banned && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 border border-red-400/30 text-red-400 rounded-full">已封禁</span>}
                </div>
                <p className="text-xs text-white/40">@{u.username} · {u.tenant_id ?? 'no tenant'}</p>
                {u.is_banned && u.ban_reason && <p className="text-[10px] text-red-400/50 mt-0.5">原因：{u.ban_reason}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role === 'super_admin' ? 'text-amber-400 bg-amber-500/10 border-amber-400/20' : u.role === 'admin' ? 'text-blue-400 bg-blue-500/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10'}`}>
                  {u.role}
                </span>
                <span className="text-xs text-white/30">{new Date(u.created_at).toLocaleDateString('zh-TW')}</span>
                {u.role !== 'super_admin' && (
                  u.is_banned ? (
                    <button
                      onClick={() => handleBan(u.id, 'unban')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors"
                    >
                      <UserCheck className="w-3 h-3" />
                      解禁
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const reason = prompt('封禁原因（選填）：') ?? '違反社群規範'
                        handleBan(u.id, 'ban', reason)
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                    >
                      <Ban className="w-3 h-3" />
                      封禁
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-semibold text-white mb-4">審查檢舉 — {REASON_LABELS[selectedReport.reason]}</h3>
            {selectedReport.target_content && (
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-white/50 mb-4">
                {renderDmContent(selectedReport.target_content)}
              </div>
            )}
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="審查備註（選填）"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReportAction(selectedReport.id, 'resolved')}
                className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl text-sm hover:bg-emerald-500/30 transition-colors"
              >
                ✅ 已處理（違規）
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, 'dismissed')}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/50 rounded-xl text-sm hover:text-white/70 transition-colors"
              >
                ❌ 駁回（無違規）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

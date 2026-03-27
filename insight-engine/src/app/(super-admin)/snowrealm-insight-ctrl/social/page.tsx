'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, FileText, MessageSquare, Users, Flag, Trash2, CheckCircle, XCircle, Clock, Eye, RefreshCw, Ban, UserCheck, Activity } from 'lucide-react'

type Tab = 'reports' | 'posts' | 'dms' | 'users'

interface Stats {
  totalPosts: number
  totalDms: number
  totalUsers: number
  pendingReports: number
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

interface Dm {
  id: string
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

  // file
  const fileMatch = content.match(/^\[file:(https?:\/\/[^\]]+)\|([^\]]+)\]$/)
  if (fileMatch) return (
    <a href={fileMatch[1]} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-blue-300 hover:text-blue-200 hover:bg-white/10 transition-colors"
    >
      📎 {fileMatch[2]}
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
  const [dms, setDms] = useState<Dm[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [reviewNote, setReviewNote] = useState('')
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
      const data = await res.json() as { reports?: Report[]; posts?: Post[]; dms?: Dm[]; users?: User[] }
      if (data.reports) setReports(data.reports)
      if (data.posts) setPosts(data.posts)
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

  const pendingCount = stats?.pendingReports ?? reports.filter(r => r.status === 'pending').length

  const TABS: { key: Tab; label: string; icon: typeof Flag; count?: number }[] = [
    { key: 'reports', label: '檢舉', icon: Flag, count: pendingCount || undefined },
    { key: 'posts', label: '全部貼文', icon: FileText, count: stats?.totalPosts || undefined },
    { key: 'dms', label: '全部私訊', icon: MessageSquare, count: stats?.totalDms || undefined },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '待審檢舉', value: stats.pendingReports, color: 'text-red-400', icon: Flag },
            { label: '全部貼文', value: stats.totalPosts, color: 'text-blue-400', icon: FileText },
            { label: '全部私訊', value: stats.totalDms, color: 'text-purple-400', icon: MessageSquare },
            { label: '全部用戶', value: stats.totalUsers, color: 'text-emerald-400', icon: Users },
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
                    <div className="mt-2 bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/50 line-clamp-2">
                      {r.target_content}
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

      {/* DMs Tab — ALL messages regardless of report status */}
      {tab === 'dms' && (
        <div className="space-y-3">
          {loading && <p className="text-slate-400 text-sm py-4 text-center">載入中...</p>}
          {!loading && dms.length === 0 && <EmptyState icon={MessageSquare} text="目前沒有私訊記錄" />}
          {dms.map(dm => (
            <div key={dm.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                <span className="text-white/70 font-medium">{dm.fromName}</span>
                <span>→</span>
                <span className="text-white/70 font-medium">{dm.toName}</span>
                <span className="ml-auto">{new Date(dm.createdAt).toLocaleString('zh-TW')}</span>
              </div>
              <div className="bg-black/20 rounded-xl px-3 py-2 min-h-[2rem]">
                {renderDmContent(dm.content)}
              </div>
            </div>
          ))}
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

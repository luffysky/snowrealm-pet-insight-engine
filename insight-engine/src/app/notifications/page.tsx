'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Heart, MessageSquare, UserPlus, Loader2, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'story_reply' | 'poll_result'
  actorId: string
  actorName: string
  actorAvatar: string | null
  targetId: string | null
  targetTitle: string | null
  createdAt: string
  readAt: string | null
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-rose-400" />,
  comment: <MessageSquare className="w-4 h-4 text-blue-400" />,
  follow: <UserPlus className="w-4 h-4 text-emerald-400" />,
  story_reply: <MessageSquare className="w-4 h-4 text-purple-400" />,
  poll_result: <Bell className="w-4 h-4 text-amber-400" />,
}

const TYPE_LABEL: Record<string, string> = {
  like: '對你的貼文按讚',
  comment: '留言在你的貼文',
  follow: '開始追蹤你',
  story_reply: '回覆了你的限時動態',
  poll_result: '投票結果出爐',
}

function getTargetUrl(n: Notification): string | null {
  if (n.type === 'follow') return `/u/${n.actorId}`
  if ((n.type === 'like' || n.type === 'comment') && n.targetId) return `/articles/${n.targetId}`
  if (n.type === 'story_reply' && n.targetId) return `/story/view?storyId=${n.targetId}`
  return null
}

function FollowBackButton({ actorId }: { actorId: string }) {
  const [following, setFollowing] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/social/follow?userId=${actorId}`)
      .then(r => r.ok ? r.json() as Promise<{ isFollowing: boolean }> : null)
      .then(d => { if (d !== null) setFollowing(d.isFollowing) })
      .catch(() => {})
  }, [actorId])

  const toggle = async () => {
    setLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch('/api/admin/social/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: actorId }),
      })
      if (res.ok) setFollowing(f => !f)
    } finally {
      setLoading(false)
    }
  }

  if (following === null) return null

  return (
    <button
      onClick={e => { e.stopPropagation(); toggle() }}
      disabled={loading}
      className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50 ${
        following
          ? 'bg-white/8 border-white/12 text-white/50 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400'
          : 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
      }`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : following ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
      {following ? '已追蹤' : '回追'}
    </button>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => {
        if (!d?.userId) { router.push(`/login?redirect=/notifications`); return }
        setMeId(d.userId)
        return fetch('/api/admin/social/notifications')
      })
      .then(r => r?.ok ? r.json() as Promise<{ notifications: Notification[] }> : null)
      .then(d => { if (d?.notifications) setNotifications(d.notifications) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const markAllRead = async () => {
    await fetch('/api/admin/social/notifications', { method: 'PATCH' }).catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
  }

  const markOneRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    await fetch('/api/admin/social/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: notifId }),
    }).catch(() => {})
  }

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '剛剛'
    if (mins < 60) return `${mins} 分鐘前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} 小時前`
    return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  const unreadCount = notifications.filter(n => !n.readAt).length

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-[var(--bnav-h,0px)]">
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-semibold flex-1">
            通知
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              全部已讀
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center pt-20">
            <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-white/25">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">目前沒有通知</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(n => {
              const targetUrl = getTargetUrl(n)
              const isUnread = !n.readAt

              const content = (
                <div className={`flex items-start gap-3 px-4 py-3.5 transition-colors lg-dark-sharp relative overflow-hidden ${isUnread ? 'bg-amber-400/[0.04]' : ''} ${targetUrl ? 'hover:bg-white/5 cursor-pointer' : ''}`}>
                  {/* Actor avatar — click to go to profile */}
                  <Link href={`/u/${n.actorId}`} onClick={() => markOneRead(n.id)} className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/70 overflow-hidden">
                      {n.actorAvatar ? (
                        <img src={n.actorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : n.actorName.slice(0, 2).toUpperCase()}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 leading-relaxed">
                      <Link href={`/u/${n.actorId}`} className="font-semibold text-white hover:text-amber-300 transition-colors">
                        {n.actorName}
                      </Link>
                      {' '}{TYPE_LABEL[n.type] ?? n.type}
                      {n.targetTitle && (
                        <span className="text-white/50">：{n.targetTitle.slice(0, 20)}{n.targetTitle.length > 20 ? '...' : ''}</span>
                      )}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{formatTime(n.createdAt)}</p>
                  </div>

                  {/* Right: type icon + follow button */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="mt-1">{TYPE_ICON[n.type]}</div>
                    {meId && n.actorId !== meId && (
                      <FollowBackButton actorId={n.actorId} />
                    )}
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2 self-start" />
                  )}
                </div>
              )

              if (targetUrl && n.type !== 'follow') {
                return (
                  <Link key={n.id} href={targetUrl} onClick={() => markOneRead(n.id)}>
                    {content}
                  </Link>
                )
              }
              return <div key={n.id}>{content}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}

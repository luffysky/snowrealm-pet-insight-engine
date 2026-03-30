'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  website_url: string | null
  instagram_handle: string | null
  twitter_handle: string | null
  is_profile_public: boolean
  followers: number
  following: number
  friend_status?: string | null
  is_self?: boolean
  is_following?: boolean
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [following, setFollowing] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.userId) setMeId(d.userId)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!params.userId) return
    setLoading(true)
    fetch(`/api/users/${params.userId}`)
      .then(r => r.json())
      .then((data: { user?: UserProfile; error?: string }) => {
        if (data.error || !data.user) {
          setError(data.error ?? '找不到用戶')
        } else {
          setUser(data.user)
          setFollowing(data.user.is_following ?? false)
        }
      })
      .catch(() => setError('載入失敗'))
      .finally(() => setLoading(false))
  }, [params.userId])

  const sendMessage = () => {
    router.push(`/messages?userId=${params.userId}`)
  }

  const toggleFollow = async () => {
    if (!user) return
    setSending(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      await fetch('/api/admin/social/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      })
      setFollowing(f => !f)
      setUser(u => u ? { ...u, followers: following ? u.followers - 1 : u.followers + 1 } : u)
    } finally {
      setSending(false)
    }
  }

  const addFriend = async () => {
    if (!user) return
    setSending(true)
    try {
      await fetch('/api/admin/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      })
      setUser(u => u ? { ...u, friend_status: 'pending' } : u)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-4xl">👤</p>
        <h1 className="text-xl font-bold text-white">找不到此用戶</h1>
        <p className="text-white/40 text-sm">{error}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">
          ← 返回
        </button>
      </div>
    )
  }

  if (!user.is_profile_public) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-4xl">🔒</p>
        <h1 className="text-xl font-bold text-white">此頁面為私密</h1>
        <p className="text-white/40 text-sm">這位用戶已將個人頁面設為私密</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">
          ← 返回
        </button>
      </div>
    )
  }

  const displayName = user.display_name || user.username || '用戶'
  const isSelf = meId === user.id

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 bg-gradient-to-br from-slate-800 to-slate-900">
        {user.banner_url && (
          <Image src={user.banner_url} alt="banner" fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
      </div>

      {/* Profile section */}
      <div className="max-w-2xl mx-auto px-4 -mt-12 pb-16">
        <div className="flex items-end justify-between mb-4">
          {/* Avatar */}
          <div className="relative">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={displayName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-950"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-slate-950">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isSelf && (
            <div className="flex gap-2 pb-1">
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-slate-700 transition-colors"
              >
                💬 訊息
              </button>
              {user.friend_status !== 'accepted' && user.friend_status !== 'pending' && (
                <button
                  onClick={addFriend}
                  disabled={sending}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm rounded-xl transition-colors"
                >
                  ➕ 加好友
                </button>
              )}
              {user.friend_status === 'pending' && (
                <span className="px-4 py-2 text-amber-400 text-sm">⏳ 待確認</span>
              )}
              {user.friend_status === 'accepted' && (
                <span className="px-4 py-2 text-emerald-400 text-sm">✓ 好友</span>
              )}
              <button
                onClick={toggleFollow}
                disabled={sending}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors disabled:opacity-50 ${
                  following
                    ? 'bg-white/5 border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20'
                    : 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
                }`}
              >
                {following ? '取消追蹤' : '+ 追蹤'}
              </button>
            </div>
          )}
          {isSelf && (
            <Link
              href="/insight-admin/account"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-slate-700 transition-colors pb-1"
            >
              ✏️ 編輯資料
            </Link>
          )}
        </div>

        {/* Name & username */}
        <h1 className="text-2xl font-bold text-white">{displayName}</h1>
        {user.username && <p className="text-white/40 text-sm mt-0.5">@{user.username}</p>}

        {/* Bio */}
        {user.bio && (
          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-md">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{user.followers}</p>
            <p className="text-xs text-white/40">追蹤者</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{user.following}</p>
            <p className="text-xs text-white/40">追蹤中</p>
          </div>
        </div>

        {/* Links */}
        {(user.website_url || user.instagram_handle || user.twitter_handle) && (
          <div className="flex flex-wrap gap-3 mt-4">
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                🌐 {user.website_url.replace(/^https?:\/\//, '')}
              </a>
            )}
            {user.instagram_handle && (
              <a href={`https://instagram.com/${user.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-400 hover:text-pink-300 transition-colors">
                📷 @{user.instagram_handle}
              </a>
            )}
            {user.twitter_handle && (
              <a href={`https://twitter.com/${user.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                𝕏 @{user.twitter_handle}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

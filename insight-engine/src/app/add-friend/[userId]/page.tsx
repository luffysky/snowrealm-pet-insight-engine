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
  bio: string | null
  friend_status: string | null
}

export default function AddFriendPage() {
  const params = useParams<{ userId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // Check login status
    fetch('/api/auth/me')
      .then(r => {
        setIsLoggedIn(r.ok)
        return r.ok ? r.json() : null
      })
      .catch(() => setIsLoggedIn(false))
  }, [])

  useEffect(() => {
    if (!params.userId || isLoggedIn === null) return
    if (!isLoggedIn) {
      router.push(`/login?redirect=/add-friend/${params.userId}`)
      return
    }
    fetch(`/api/admin/social/friends?type=profile&userId=${params.userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setUser(data.user)
      })
      .catch(() => setError('載入失敗'))
      .finally(() => setLoading(false))
  }, [params.userId, isLoggedIn, router])

  const sendRequest = async () => {
    if (!user || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: user.id }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setSent(true)
        setUser(prev => prev ? { ...prev, friend_status: 'pending' } : prev)
      } else {
        setError(data.error ?? '發送失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setSending(false)
    }
  }

  if (isLoggedIn === false) {
    return null // redirecting
  }

  if (loading || isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/40 animate-pulse text-sm">載入中...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">👤</p>
        <h1 className="text-xl font-bold text-white">找不到此用戶</h1>
        <p className="text-white/50 text-sm">{error}</p>
        <Link href="/messages" className="mt-2 px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
          回到訊息
        </Link>
      </div>
    )
  }

  if (!user) return null

  const isFriend = user.friend_status === 'accepted'
  const isPending = user.friend_status === 'pending'
  const displayName = user.display_name || user.username || '未知用戶'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        <div className="space-y-1">
          <div className="text-3xl">❄️</div>
          <p className="text-xs text-slate-500">SnowRealm</p>
        </div>

        {/* 用戶卡片 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={displayName}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              {user.username && (
                <p className="text-sm text-white/40">@{user.username}</p>
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-white/60 text-center leading-relaxed">{user.bio}</p>
            )}
          </div>

          {/* 操作按鈕 */}
          {isFriend ? (
            <div className="space-y-2">
              <p className="text-emerald-400 text-sm font-medium">✓ 已是好友</p>
              <Link
                href="/messages"
                className="block w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
              >
                💬 發訊息
              </Link>
            </div>
          ) : isPending || sent ? (
            <p className="text-amber-400 text-sm font-medium py-2">
              ⏳ 好友請求已送出，等待對方確認
            </p>
          ) : (
            <button
              onClick={sendRequest}
              disabled={sending}
              className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {sending ? '發送中...' : `➕ 加 ${displayName} 為好友`}
            </button>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <Link href="/messages" className="text-xs text-white/30 hover:text-white/50 transition-colors">
          回到訊息
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X } from 'lucide-react'
import { UserAlbum } from '@/components/social/UserAlbum'
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
import { FollowButton } from '@/components/social/FollowButton'
import { DMButton } from '@/components/social/DMButton'
import { LoginPrompt } from '@/components/social/LoginPrompt'

interface UserProfile {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  websiteUrl: string | null
  instagramHandle: string | null
  twitterHandle: string | null
  isProfilePublic: boolean
  followers: number
  following: number
  isFollowing: boolean
  posts: {
    id: string
    type: string
    title: string | null
    content: string
    createdAt: string
    likesCount: number
    commentsCount: number
  }[]
}

interface FollowUser {
  id: string
  display_name: string | null
  avatar_url: string | null
}

function FollowListModal({
  type,
  userId,
  onClose,
}: {
  type: 'followers' | 'following'
  userId: string
  onClose: () => void
}) {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/social/follow?userId=${userId}&list=${type}`)
      .then(r => r.ok ? r.json() as Promise<{ users: FollowUser[] }> : null)
      .then(d => { if (d?.users) setUsers(d.users) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, type])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white/80">{type === 'followers' ? '粉絲' : '追蹤中'}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-white/25 text-sm py-8">還沒有{type === 'followers' ? '粉絲' : '追蹤的人'}</p>
          ) : (
            users.map(u => (
              <Link
                key={u.id}
                href={`/u/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.display_name ?? '?').charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-sm text-white/75 truncate">{u.display_name ?? '用戶'}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams() as { userId: string }
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [albumPhotos, setAlbumPhotos] = useState<{ id: string; url: string; caption: string | null; is_public: boolean; display_order: number; created_at: string }[]>([])
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => { if (d?.userId) setMeId(d.userId) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.ok ? r.json() as Promise<UserProfile> : null)
      .then(d => { if (d) setProfile(d) })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    fetch(`/api/admin/social/album?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.photos) setAlbumPhotos(d.photos) })
      .catch(() => {})
  }, [userId])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/40">
      <div className="text-center space-y-3">
        <p className="text-4xl">😕</p>
        <p>用戶不存在</p>
        <Link href="/articles" className="text-amber-400 text-sm underline">← 回到社群</Link>
      </div>
    </div>
  )

  const initials = profile.name.slice(0, 2).toUpperCase()
  const isMe = meId === userId

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} action="追蹤或私訊" />
      {followModal && (
        <FollowListModal type={followModal} userId={userId} onClose={() => setFollowModal(null)} />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/articles" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 社群
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-white/80 overflow-hidden shrink-0">
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{profile.name}</h1>
              {profile.bio && (
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{profile.bio}</p>
              )}

              {/* Social links */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-amber-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" /> 網站
                  </a>
                )}
                {profile.instagramHandle && (
                  <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-pink-400 transition-colors"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" /> @{profile.instagramHandle}
                  </a>
                )}
                {profile.twitterHandle && (
                  <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-blue-400 transition-colors"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" /> @{profile.twitterHandle}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-white font-semibold">{profile.posts.length}</p>
              <p className="text-white/35 text-xs">貼文</p>
            </div>
            <button
              onClick={() => setFollowModal('followers')}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <p className="text-white font-semibold">{profile.followers}</p>
              <p className="text-white/35 text-xs">粉絲</p>
            </button>
            <button
              onClick={() => setFollowModal('following')}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <p className="text-white font-semibold">{profile.following}</p>
              <p className="text-white/35 text-xs">追蹤中</p>
            </button>
          </div>

          {/* Action buttons */}
          {!isMe && (
            <div className="flex gap-2">
              {meId ? (
                <>
                  <FollowButton targetUserId={userId} initialFollowing={profile.isFollowing} />
                  <DMButton targetUserId={userId} targetName={profile.name} targetAvatar={profile.avatar ?? undefined} />
                </>
              ) : (
                <>
                  <button
                    onClick={() => setLoginPrompt(true)}
                    className="flex-1 py-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    追蹤
                  </button>
                  <button
                    onClick={() => setLoginPrompt(true)}
                    className="flex-1 py-2 bg-white/8 border border-white/12 text-white/60 rounded-xl text-sm hover:bg-white/12 transition-colors"
                  >
                    私訊
                  </button>
                </>
              )}
            </div>
          )}
          {isMe && (
            <Link href="/insight-admin/profile"
              className="block text-center py-2 bg-white/8 border border-white/12 text-white/60 rounded-xl text-sm hover:bg-white/12 transition-colors"
            >
              編輯個人資料
            </Link>
          )}
        </div>

        {/* Album */}
        <UserAlbum userId={userId} isOwner={isMe} initialPhotos={albumPhotos} />

        {/* Posts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider px-1">貼文</h2>
          {profile.posts.length === 0 ? (
            <div className="text-center py-12 text-white/25">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">還沒有貼文</p>
            </div>
          ) : (
            profile.posts.map(post => (
              <Link key={post.id} href={`/articles/${post.id}`}
                className="block bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:bg-white/[0.06] hover:border-white/14 transition-all"
              >
                {post.title && (
                  <p className="font-semibold text-white/85 mb-1 line-clamp-1">{post.title}</p>
                )}
                <p className="text-sm text-white/55 leading-relaxed line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-white/25">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount}
                  </span>
                  <span className="ml-auto">
                    {new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

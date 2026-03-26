'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Camera, Globe, Link as LinkIcon, Save, Loader2, Edit2, X } from 'lucide-react'

// Simple SVG icons for social platforms
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
)
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
import { PostComposer } from '@/components/social/PostComposer'
import { PostCard } from '@/components/social/PostCard'
import type { UserProfile, SocialPost } from '@/lib/socialEngine'

interface AuthMe {
  id: string
  username: string
  role: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'articles'>('posts')

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
    instagramHandle: '',
    twitterHandle: '',
    isProfilePublic: true,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      const [meRes, profileRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/profile'),
      ])
      const meData = await meRes.json() as AuthMe
      const profileData = await profileRes.json() as { profile: UserProfile }
      setMe(meData)
      setProfile(profileData.profile)
      if (profileData.profile) {
        setForm({
          displayName: profileData.profile.displayName ?? '',
          bio: profileData.profile.bio ?? '',
          websiteUrl: profileData.profile.websiteUrl ?? '',
          instagramHandle: profileData.profile.instagramHandle ?? '',
          twitterHandle: profileData.profile.twitterHandle ?? '',
          isProfilePublic: profileData.profile.isProfilePublic ?? true,
        })
      }
    } catch {
      // ignore
    }
  }, [])

  const loadPosts = useCallback(async () => {
    if (!me?.id) return
    try {
      const res = await fetch(`/api/admin/social/posts?userId=${me.id}&type=${activeTab === 'posts' ? 'post' : 'article'}`)
      const data = await res.json() as { posts: SocialPost[] }
      setPosts(data.posts ?? [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [me?.id, activeTab])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (me?.id) loadPosts() }, [loadPosts, me?.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json() as { profile: UserProfile }
        setProfile(data.profile)
        setEditing(false)
        showToast('✅ 個人資料已更新')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'avatars')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string }
      if (data.url) {
        await fetch('/api/admin/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url }),
        })
        setProfile(prev => prev ? { ...prev, avatarUrl: data.url! } : prev)
        showToast('✅ 頭像已更新')
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const displayName = profile?.displayName || me?.username || '用戶'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-3xl overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-amber-600/30 via-purple-600/20 to-blue-600/30" />

          <div className="px-6 pb-6 -mt-12">
            {/* Avatar */}
            <div className="flex items-end justify-between mb-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl border-4 border-slate-950 bg-gradient-to-br from-amber-500/40 to-purple-500/40 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-xl">
                  {profile?.avatarUrl
                    ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="flex gap-2">
                <Link href="/articles" target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/15 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> 公開頁面
                </Link>
                <button onClick={() => setEditing(s => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    editing ? 'bg-white/10 text-white/60' : 'bg-amber-500/20 border border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" /> {editing ? '取消' : '編輯資料'}
                </button>
              </div>
            </div>

            {!editing ? (
              <div className="space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-white">{displayName}</h1>
                  <p className="text-sm text-white/40">@{me?.username}</p>
                </div>
                {profile?.bio && <p className="text-sm text-white/60 leading-relaxed">{profile.bio}</p>}
                <div className="flex flex-wrap gap-3">
                  {profile?.websiteUrl && (
                    <a href={profile.websiteUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> {profile.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {profile?.instagramHandle && (
                    <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-pink-400/70 hover:text-pink-300 transition-colors"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" /> @{profile.instagramHandle}
                    </a>
                  )}
                  {profile?.twitterHandle && (
                    <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-400/70 hover:text-blue-300 transition-colors"
                    >
                      <TwitterIcon className="w-3.5 h-3.5" /> @{profile.twitterHandle}
                    </a>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-white/30">
                  <span><strong className="text-white/60">{posts.length}</strong> 篇貼文</span>
                  {!profile?.isProfilePublic && <span className="text-amber-400/60">🔒 私人模式</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">顯示名稱</label>
                    <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                      placeholder={me?.username}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-amber-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">個人網站</label>
                    <input value={form.websiteUrl} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-amber-400/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">個人簡介</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="介紹一下自己..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-amber-400/40 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 flex items-center gap-1"><InstagramIcon className="w-3 h-3 text-pink-400" /> Instagram</label>
                    <input value={form.instagramHandle} onChange={e => setForm(p => ({ ...p, instagramHandle: e.target.value }))}
                      placeholder="username"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-pink-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 flex items-center gap-1"><TwitterIcon className="w-3 h-3 text-blue-400" /> Twitter / X</label>
                    <input value={form.twitterHandle} onChange={e => setForm(p => ({ ...p, twitterHandle: e.target.value }))}
                      placeholder="username"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-blue-400/40"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <div onClick={() => setForm(p => ({ ...p, isProfilePublic: !p.isProfilePublic }))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${form.isProfilePublic ? 'bg-emerald-500' : 'bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isProfilePublic ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    公開個人頁面
                  </label>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    儲存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <PostComposer
          authorName={displayName}
          authorAvatar={profile?.avatarUrl ?? undefined}
          compact
          onPosted={post => {
            setPosts(prev => [post, ...prev])
          }}
        />

        {/* Posts tabs */}
        <div className="flex border-b border-white/10">
          {(['posts', 'articles'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab ? 'text-amber-300 border-b-2 border-amber-400 -mb-px' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'posts' ? '短貼文' : '長文章'}
            </button>
          ))}
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-white/40 text-sm">還沒有{activeTab === 'posts' ? '貼文' : '文章'}，來發第一篇吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={me?.id} onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

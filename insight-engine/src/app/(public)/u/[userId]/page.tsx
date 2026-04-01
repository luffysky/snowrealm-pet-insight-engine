'use client'

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X, Settings, ChevronRight, Bell, MessageCircle, LayoutDashboard, BookOpen, Image, MoreHorizontal, Pencil, Trash2, Camera, Wallet, Library, LogOut, Bookmark } from 'lucide-react'
import { UserAlbum } from '@/components/social/UserAlbum'
import { setFloatingChatEnabled, FLOATING_CHAT_ENABLED_KEY } from '@/components/social/FloatingChat'

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Profile sidebar (only shown for own profile) ───
function ProfileSidebar({ onClose, tenantSlug, isSuperAdmin }: { onClose: () => void; tenantSlug: string | null; isSuperAdmin: boolean }) {
  const router = useRouter()
  const [floatEnabled, setFloatEnabled] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem(FLOATING_CHAT_ENABLED_KEY)
    setFloatEnabled(v !== 'false')
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  const toggleFloat = () => {
    const next = !floatEnabled
    setFloatEnabled(next)
    setFloatingChatEnabled(next)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-72 border-l border-[#b8a9e8]/25 flex flex-col shadow-2xl backdrop-blur-2xl bg-white/80">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <p className="text-sm font-semibold text-[#3d3155]">個人管理</p>
          <button onClick={onClose} className="text-[#8a7ca8]/75 hover:text-[#6b5fa8] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>

          {/* 社群創作 */}
          <SidebarSection label="社群">
            <SidebarLink href="/write" icon={<BookOpen className="w-4 h-4" />} label="發布文章" onClick={onClose} />
            <SidebarLink href="/insight-admin/blog" icon={<BookOpen className="w-4 h-4" />} label="我的部落格" onClick={onClose} />
            <SidebarLink href="/blogs" icon={<Library className="w-4 h-4" />} label="部落格廣場" onClick={onClose} />
            <SidebarLink href="/articles" icon={<Image className="w-4 h-4" />} label="相簿 &amp; 動態" onClick={onClose} />
            <SidebarLink href="/bookmarks" icon={<Bookmark className="w-4 h-4" />} label="我的收藏" onClick={onClose} />
            <SidebarLink href="/notifications" icon={<Bell className="w-4 h-4" />} label="通知" onClick={onClose} />
            <SidebarLink href="/messages" icon={<MessageCircle className="w-4 h-4" />} label="私訊" onClick={onClose} />
            <SidebarLink href="/wallet" icon={<Wallet className="w-4 h-4" />} label="Z幣錢包" onClick={onClose} />
          </SidebarSection>

          {/* 一般後台 */}
          <SidebarSection label="問卷後台">
            <SidebarLink
              href={tenantSlug ? `/insight-admin/${tenantSlug}` : '/insight-admin'}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="進入後台"
              onClick={onClose}
            />
            <SidebarLink href="/insight-admin/account" icon={<Bell className="w-4 h-4" />} label="帳號 &amp; 通知設定" onClick={onClose} />
          </SidebarSection>

          {/* 總後台（僅 super_admin） */}
          {isSuperAdmin && (
            <SidebarSection label="🌟 總後台">
              <SidebarLink
                href="/snowrealm-insight-ctrl"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Super Admin 控制台"
                onClick={onClose}
              />
            </SidebarSection>
          )}

          {/* 偏好設定 */}
          <SidebarSection label="偏好設定">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                  <MessageCircle className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm text-[#3d3155]">懸浮訊息球</p>
                  <p className="text-[11px] text-[#8a7ca8]/80">可拖曳的快速訊息入口</p>
                </div>
              </div>
              <button
                onClick={toggleFloat}
                className={`relative w-10 h-5 rounded-full transition-colors ${floatEnabled ? 'bg-sky-500' : 'bg-white/15'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${floatEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </SidebarSection>

        </div>
        <div className="shrink-0 border-t border-white/8" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
          <p className="text-[11px] text-[#8a7ca8]/60 text-center px-4 pt-3 pb-2">長按訊息可產生可拖曳懸浮球</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50/60 transition-colors group disabled:opacity-50"
          >
            <span className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors shrink-0">
              <LogOut className="w-4 h-4" />
            </span>
            <span className="text-sm text-red-500 font-medium">
              {loggingOut ? '登出中...' : '登出'}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

function SidebarSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-2 text-[10px] font-semibold text-[#8a7ca8]/60 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function SidebarLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#3d3155]/8 active:bg-[#3d3155]/14 transition-colors group"
    >
      <span className="w-8 h-8 rounded-xl bg-[#3d3155]/5 group-hover:bg-[#6b5fa8]/15 flex items-center justify-center text-[#8a7ca8] group-hover:text-[#6b5fa8] transition-colors">
        {icon}
      </span>
      <span className="flex-1 text-sm text-[#3d3155]/80 group-hover:text-[#3d3155] transition-colors">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-[#b5a8d0] group-hover:text-[#6b5fa8] transition-colors" />
    </Link>
  )
}

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

const PROFILE_THEMES: Record<string, { from: string; via: string; to: string }> = {
  default: { from: '#d97706', via: '#9333ea', to: '#2563eb' },
  ocean:   { from: '#2563eb', via: '#06b6d4', to: '#0d9488' },
  sunset:  { from: '#f97316', via: '#ec4899', to: '#9333ea' },
  forest:  { from: '#16a34a', via: '#10b981', to: '#0d9488' },
  night:   { from: '#1e293b', via: '#312e81', to: '#0f172a' },
  rose:    { from: '#e11d48', via: '#ec4899', to: '#a21caf' },
  gold:    { from: '#eab308', via: '#f59e0b', to: '#ea580c' },
  aurora:  { from: '#7c3aed', via: '#8b5cf6', to: '#ec4899' },
}

function getBannerStyle(theme: string | null, bannerUrl: string | null): React.CSSProperties {
  if (bannerUrl) return { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  const t = PROFILE_THEMES[theme ?? 'default'] ?? PROFILE_THEMES['default']
  return { background: `linear-gradient(to right, ${t.from}4d, ${t.via}33, ${t.to}66)` }
}

interface UserProfile {
  id: string
  name: string
  avatar: string | null
  bannerUrl: string | null
  profileTheme: string | null
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
  is_following_back?: boolean
}

interface Story {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  canvas: Record<string, unknown>
  expires_at: string
  is_highlight: boolean
  has_viewed: boolean
}

function FollowListModal({ type, userId, onClose }: { type: 'followers' | 'following'; userId: string; onClose: () => void }) {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/social/follow?userId=${userId}&list=${type}`)
      .then(r => r.ok ? r.json() as Promise<{ users: FollowUser[] }> : null)
      .then(d => {
        if (d?.users) {
          // For following list, all users are ones we follow → default is_following_back to true
          const users = type === 'following'
            ? d.users.map(u => ({ ...u, is_following_back: u.is_following_back ?? true }))
            : d.users
          setUsers(users)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, type])

  const toggleFollow = async (targetId: string, isFollowing: boolean) => {
    const method = isFollowing ? 'DELETE' : 'POST'
    const res = await fetch('/api/admin/social/follow', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: targetId }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, is_following_back: !isFollowing } : u))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pt-4 sm:p-4"
      style={{ paddingBottom: 'calc(var(--bnav-h, 76px) + 0.5rem)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-sm lg-lavender-sharp lg-lg relative overflow-hidden shadow-2xl sm:mb-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h3 className="text-sm font-semibold text-[#3d3155]">{type === 'followers' ? `粉絲 · ${users.length}` : `追蹤中 · ${users.length}`}</h3>
          <button onClick={onClose} className="text-[#8a7ca8]/75 hover:text-[#6b5fa8] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#8a7ca8]/75 animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-[#8a7ca8]/60 text-sm py-8">還沒有{type === 'followers' ? '粉絲' : '追蹤的人'}</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <Link href={`/u/${u.id}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#3d3155]/85 truncate">{u.display_name ?? '用戶'}</p>
                    {u.is_following_back && type === 'followers' && (
                      <p className="text-[10px] text-emerald-400/70">互相追蹤</p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(u.id, !!u.is_following_back)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                    u.is_following_back
                      ? 'bg-white/8 border-white/12 text-white/50 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400'
                      : 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
                  }`}
                >
                  {u.is_following_back ? '追蹤中' : (type === 'followers' ? '回追' : '追蹤')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Lightbox for avatar/images
function AvatarLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute top-4 right-4 text-[#6b5fa8] hover:text-white" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt="" className="max-w-sm w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
    </div>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams() as { userId: string }
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)
  const [meTenantSlug, setMeTenantSlug] = useState<string | null>(null)
  const [meIsSuperAdmin, setMeIsSuperAdmin] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [albumPhotos, setAlbumPhotos] = useState<{ id: string; url: string; caption: string | null; is_public: boolean; display_order: number; created_at: string }[]>([])
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [avatarLightbox, setAvatarLightbox] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [nickname, setNickname] = useState<string>('')
  const [nicknameEditing, setNicknameEditing] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string; tenantId?: string; role?: string }> : null)
      .then(d => {
        if (d?.userId) setMeId(d.userId)
        if (d?.tenantId) setMeTenantSlug(d.tenantId)
        if (d?.role === 'super_admin') setMeIsSuperAdmin(true)
      })
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

  useEffect(() => {
    fetch(`/api/admin/social/stories?userId=${userId}`)
      .then(r => r.ok ? r.json() as Promise<{ stories: Story[] }> : null)
      .then(d => { if (d?.stories) setStories(d.stories) })
      .catch(() => {})
  }, [userId])

  // Load nickname (only for other users' profiles)
  useEffect(() => {
    if (!meId || meId === userId) return
    fetch(`/api/admin/social/contact-notes?userId=${userId}`)
      .then(r => r.ok ? r.json() as Promise<{ nickname: string | null }> : null)
      .then(d => { if (d?.nickname) setNickname(d.nickname) })
      .catch(() => {})
  }, [meId, userId])

  // Close post menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDeletePost = async (postId: string) => {
    if (!confirm('確定要刪除這篇貼文嗎？')) return
    const res = await fetch(`/api/admin/social/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, posts: prev.posts.filter(p => p.id !== postId) } : prev)
    }
    setOpenMenuId(null)
  }

  const saveNickname = async () => {
    const trimmed = nicknameDraft.trim()
    await fetch('/api/admin/social/contact-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, nickname: trimmed }),
    })
    setNickname(trimmed)
    setNicknameEditing(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
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
        setProfile(prev => prev ? { ...prev, avatar: data.url! } : prev)
      }
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-[#b5a8d0]">
      <div className="text-center space-y-3">
        <p className="text-4xl">😕</p>
        <p>用戶不存在</p>
        <Link href="/articles" className="text-amber-400 text-sm underline">← 回到社群</Link>
      </div>
    </div>
  )

  const initials = profile.name.slice(0, 2).toUpperCase()
  const isMe = meId === userId
  const bannerStyle = getBannerStyle(profile.profileTheme, profile.bannerUrl)

  return (
    <div className="min-h-screen text-[#3d3155]" style={{ background: "linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)", fontFamily: "var(--font-zen-maru), var(--font-noto-tc), sans-serif" }}>
      <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} action="追蹤或私訊" />
      {followModal && <FollowListModal type={followModal} userId={userId} onClose={() => setFollowModal(null)} />}
      {sidebarOpen && isMe && <ProfileSidebar onClose={() => setSidebarOpen(false)} tenantSlug={meTenantSlug} isSuperAdmin={meIsSuperAdmin} />}
      {avatarLightbox && profile.avatar && <AvatarLightbox src={profile.avatar} onClose={() => setAvatarLightbox(false)} />}

      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-xl border-b border-[#b8a9e8]/20 bg-[rgba(243,238,255,0.88)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/articles" className="flex items-center gap-2 text-sm text-[#6b5fa8] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 社群
          </Link>
          {isMe && (
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/bookmarks"
                className="p-1.5 text-[#8a7ca8]/75 hover:text-amber-500 hover:bg-white/8 rounded-lg transition-colors"
              >
                <Bookmark className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-[#8a7ca8]/75 hover:text-[#3d3155]/80 hover:bg-white/8 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="lg-lavender-sharp lg-lg relative overflow-hidden">
          {/* Banner */}
          <div className="h-24" style={bannerStyle} />

          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end justify-between mb-4">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className={`w-20 h-20 rounded-2xl border-4 border-slate-950 bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-white/80 overflow-hidden shrink-0 shadow-xl ${profile.avatar ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isMe) return // isMe handled by label below
                    if (profile.avatar) setAvatarLightbox(true)
                  }}
                >
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                {isMe && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {avatarUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>

              {/* Edit / follow buttons */}
              {isMe ? (
                <Link href="/insight-admin/profile"
                  className="px-4 py-1.5 bg-white/8 border border-white/12 text-[#6b5fa8] rounded-xl text-sm hover:bg-white/12 transition-colors"
                >
                  編輯個人資料
                </Link>
              ) : (
                <div className="flex gap-2">
                  {meId ? (
                    <>
                      <FollowButton targetUserId={userId} initialFollowing={profile.isFollowing} />
                      <DMButton targetUserId={userId} targetName={profile.name} targetAvatar={profile.avatar ?? undefined} />
                    </>
                  ) : (
                    <>
                      <button onClick={() => setLoginPrompt(true)} className="px-4 py-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors">追蹤</button>
                      <button onClick={() => setLoginPrompt(true)} className="px-4 py-1.5 bg-white/8 border border-white/12 text-[#6b5fa8] rounded-xl text-sm hover:bg-white/12 transition-colors">私訊</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Name + nickname */}
            {nickname && !isMe ? (
              <div>
                <h1 className="text-xl font-bold text-[#3d3155]">{nickname}</h1>
                <p className="text-sm text-[#8a7ca8]/80">{profile.name}</p>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-[#3d3155]">{profile.name}</h1>
            )}

            {/* Nickname edit (only for other users when logged in) */}
            {!isMe && meId && (
              <div className="mt-1.5">
                {nicknameEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nicknameDraft}
                      onChange={e => setNicknameDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setNicknameEditing(false) }}
                      placeholder="輸入備註名字…"
                      className="text-xs bg-white/8 border border-white/12 rounded-lg px-2.5 py-1 text-[#3d3155] placeholder-white/25 outline-none focus:border-amber-400/50 w-36"
                    />
                    <button onClick={saveNickname} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">儲存</button>
                    <button onClick={() => setNicknameEditing(false)} className="text-xs text-[#8a7ca8]/75 hover:text-[#6b5fa8] transition-colors">取消</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNicknameDraft(nickname); setNicknameEditing(true) }}
                    className="flex items-center gap-1 text-xs text-[#8a7ca8]/75 hover:text-[#6b5fa8] transition-colors group"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{nickname ? `備註：${nickname}` : '新增備註名字'}</span>
                  </button>
                )}
              </div>
            )}

            {profile.bio && <p className="text-sm text-[#6b5fa8] mt-1 leading-relaxed">{profile.bio}</p>}

            {/* Social links */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#8a7ca8] hover:text-amber-300 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> 網站
                </a>
              )}
              {profile.instagramHandle && (
                <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#8a7ca8] hover:text-pink-400 transition-colors">
                  <InstagramIcon className="w-3.5 h-3.5" /> @{profile.instagramHandle}
                </a>
              )}
              {profile.twitterHandle && (
                <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#8a7ca8] hover:text-blue-400 transition-colors">
                  <TwitterIcon className="w-3.5 h-3.5" /> @{profile.twitterHandle}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm mt-3">
              <div className="text-center">
                <p className="text-[#3d3155] font-semibold">{profile.posts.length}</p>
                <p className="text-[#8a7ca8]/80 text-xs">貼文</p>
              </div>
              <button onClick={() => setFollowModal('followers')} className="text-center hover:opacity-70 transition-opacity">
                <p className="text-[#3d3155] font-semibold">{profile.followers}</p>
                <p className="text-[#8a7ca8]/80 text-xs">粉絲</p>
              </button>
              <button onClick={() => setFollowModal('following')} className="text-center hover:opacity-70 transition-opacity">
                <p className="text-[#3d3155] font-semibold">{profile.following}</p>
                <p className="text-[#8a7ca8]/80 text-xs">追蹤中</p>
              </button>
            </div>
          </div>
        </div>

        {/* Stories row */}
        {stories.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#8a7ca8] uppercase tracking-wider px-1 mb-3">限時動態</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {stories.map(story => (
                <Link
                  key={story.id}
                  href={`/story/view?storyId=${story.id}&userId=${userId}`}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${story.has_viewed ? 'border-white/15' : 'border-amber-400'} p-0.5`}>
                    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-800">
                      {story.user_avatar
                        ? <img src={story.user_avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[#8a7ca8] text-xs">動態</div>
                      }
                    </div>
                  </div>
                  <span className="text-[10px] text-[#8a7ca8] truncate max-w-[4rem]">
                    {story.is_highlight ? '精選' : new Date(story.expires_at).getTime() > Date.now() ? '限時' : '已過期'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Album */}
        <UserAlbum userId={userId} isOwner={isMe} initialPhotos={albumPhotos} />

        {/* Posts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#8a7ca8] uppercase tracking-wider px-1">貼文</h2>
          {profile.posts.length === 0 ? (
            <div className="text-center py-12 text-[#8a7ca8]/60">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">還沒有貼文</p>
            </div>
          ) : (
            profile.posts.map(post => (
              <div key={post.id} className="relative group">
                <Link href={`/articles/${post.id}`}
                  className="block lg-lavender rounded-2xl p-4 hover:border-[#b8a9e8]/40 transition-all"
                >
                  {post.title && <p className="font-semibold text-white/85 mb-1 line-clamp-1 pr-8">{post.title}</p>}
                  <p className="text-sm text-[#6b5fa8]/85 leading-relaxed line-clamp-2 pr-8">{stripHtml(post.content)}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#8a7ca8]/60">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likesCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount}</span>
                    <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </Link>

                {/* Three-dot menu for own posts */}
                {isMe && (
                  <div className="absolute top-3 right-3" ref={openMenuId === post.id ? menuRef : undefined}>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === post.id ? null : post.id) }}
                      className="p-1.5 text-[#8a7ca8]/75 hover:text-[#3d3155]/80 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === post.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/articles/${post.id}/edit`}
                          onClick={() => setOpenMenuId(null)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#3d3155]/80 hover:bg-white/8 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> 編輯貼文
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 刪除貼文
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

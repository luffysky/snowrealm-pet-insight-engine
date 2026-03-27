'use client'

import { useRef, useState, useCallback } from 'react'
import { X, Download, Copy, Check, Share2 } from 'lucide-react'
import type { SocialPost } from '@/lib/socialEngine'
import { useShareCard } from '@/hooks/useShareCard'

interface SharePostModalProps {
  open: boolean
  onClose: () => void
  post: SocialPost
}

export function SharePostModal({ open, onClose, post }: SharePostModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const { saving, saveImage } = useShareCard()

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${post.id}`

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [postUrl])

  const shareToLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(postUrl)}`, '_blank')
  }

  if (!open) return null

  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
  const snippet = post.type === 'article'
    ? post.content.replace(/<[^>]+>/g, '').slice(0, 180)
    : post.content.slice(0, 180)
  const displayName = post.authorName ?? '用戶'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm">
        {/* Liquid glass wrapper */}
        <div className="p-px rounded-3xl bg-gradient-to-br from-white/25 via-white/5 to-purple-500/15 shadow-2xl shadow-purple-900/30">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white/90">分享貼文</h3>
              </div>
              <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share card preview */}
            <div className="p-4">
              {/* Card — this is what gets saved as PNG */}
              <div
                ref={cardRef}
                className="rounded-2xl overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, #1a1040 0%, #0d0d1a 40%, #0f172a 70%, #1a0a30 100%)',
                }}
              >
                {/* Subtle noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                  backgroundSize: '150px',
                }} />

                {/* Top gradient shimmer bar */}
                <div className="h-0.5 bg-gradient-to-r from-violet-500/60 via-purple-400/80 to-pink-500/60" />

                {/* Glass inner content */}
                <div className="relative p-5">
                  {/* Author row */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0 ring-1 ring-white/15"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))' }}>
                      {post.authorAvatar
                        ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/90 truncate">{displayName}</p>
                      <p className="text-[10px] text-white/35">{timeStr}</p>
                    </div>
                    {post.type === 'article' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: 'rgba(59,130,246,0.15)', color: 'rgba(147,197,253,0.9)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        文章
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {post.title && (
                    <h2 className="text-base font-bold text-white/90 mb-2 leading-snug">{post.title}</h2>
                  )}

                  {/* Content */}
                  <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {snippet}{snippet.length >= 180 ? '...' : ''}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.tags.slice(0, 4).map(t => (
                        <span key={t} className="text-xs" style={{ color: 'rgba(251,191,36,0.6)' }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Divider + footer */}
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        <span>❤️ {post.likesCount}</span>
                        <span>💬 {post.commentsCount}</span>
                      </div>
                      {/* Brand watermark */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-purple-400/50" />
                        <span className="text-[9px] font-medium tracking-wide" style={{ color: 'rgba(167,139,250,0.5)' }}>
                          SnowRealm Insight
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-5 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => saveImage(cardRef.current, `post-${post.id.slice(0, 8)}.png`)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(196,181,253,0.9)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  {saving ? '儲存中...' : '儲存圖片'}
                </button>
                <button
                  onClick={shareToLine}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(6,199,85,0.12)', border: '1px solid rgba(6,199,85,0.25)', color: 'rgba(134,239,172,0.9)' }}
                >
                  <span className="text-xs">💬</span>
                  LINE
                </button>
              </div>
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(253,230,138,0.85)' }}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? '已複製！' : '複製連結'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { MoreHorizontal, Trash2, Edit2, ExternalLink, Share2, ChevronLeft, ChevronRight, MessageSquare, Check } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import { InteractionBar } from './InteractionBar'
import { CommentSection } from './CommentSection'
import type { SocialPost } from '@/lib/socialEngine'

interface PostCardProps {
  post: SocialPost
  currentUserId?: string
  onDeleted?: (postId: string) => void
  showComments?: boolean
  baseUrl?: string
}

export function PostCard({ post, currentUserId, onDeleted, showComments = false, baseUrl = '' }: PostCardProps) {
  const [expanded, setExpanded] = useState(showComments)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = currentUserId === post.userId
  const postUrl = `${baseUrl}/articles/${post.id}`

  const handleDelete = async () => {
    if (!confirm('確定刪除這則貼文？')) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/social/posts/${post.id}`, { method: 'DELETE' })
      onDeleted?.(post.id)
    } finally {
      setDeleting(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin + postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin + postUrl)}`, '_blank')
  }

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + postUrl)}&text=${encodeURIComponent(post.title ?? post.content.slice(0, 100))}`, '_blank')
  }

  const shareToFb = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + postUrl)}`, '_blank')
  }

  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()
  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const hasImages = post.images.length > 0

  return (
    <article className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 shrink-0 overflow-hidden">
            {post.authorAvatar
              ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{post.authorName ?? '用戶'}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">{timeStr}</span>
              {post.type === 'article' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">文章</span>
              )}
              {!post.isPublic && (
                <span className="text-[10px] px-1.5 py-0.5 bg-white/8 text-white/30 rounded-full">私密</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Share dropdown */}
          <div className="relative">
            <button onClick={() => setShowShare(s => !s)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {showShare && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[140px]" onMouseLeave={() => setShowShare(false)}>
                <button onClick={copyLink} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4" />}
                  {copied ? '已複製！' : '複製連結'}
                </button>
                <button onClick={shareToLine} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                  <span className="text-base leading-none">💬</span> LINE
                </button>
                <button onClick={shareToTwitter} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                  <TwitterIcon className="w-4 h-4" /> Twitter / X
                </button>
                <button onClick={shareToFb} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                  <span className="text-base leading-none">📘</span> Facebook
                </button>
              </div>
            )}
          </div>
          {isOwner && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(s => !s)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[120px]" onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={handleDelete} disabled={deleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? '刪除中...' : '刪除'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title (article) */}
      {post.title && (
        <div className="px-4 pb-1">
          <h2 className="text-base font-bold text-white/90">{post.title}</h2>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {post.tags.map(t => (
            <span key={t} className="text-xs text-amber-400/60 hover:text-amber-300 cursor-pointer">#{t}</span>
          ))}
        </div>
      )}

      {/* Images carousel */}
      {hasImages && (
        <div className="relative bg-black/20">
          <div className={`${post.images.length === 1 ? '' : 'overflow-hidden'}`}>
            <img
              src={post.images[imgIdx]?.url}
              alt={post.images[imgIdx]?.alt ?? ''}
              className="w-full max-h-80 object-cover"
            />
          </div>
          {post.images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} disabled={imgIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx(i => Math.min(post.images.length - 1, i + 1))} disabled={imgIdx === post.images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Interaction bar */}
      <div className="px-4 border-t border-white/5">
        <InteractionBar
          postId={post.id}
          initialLikes={post.likesCount}
          initialComments={post.commentsCount}
          initialMyReaction={post.myReaction}
          onCommentClick={() => setExpanded(s => !s)}
          shareUrl={typeof window !== 'undefined' ? window.location.origin + postUrl : postUrl}
          shareTitle={post.title ?? post.content.slice(0, 80)}
        />
      </div>

      {/* Comments */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}
    </article>
  )
}

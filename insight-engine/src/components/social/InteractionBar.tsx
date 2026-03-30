'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Heart, MessageSquare, Bookmark, Share2, ThumbsUp, Loader2, Check } from 'lucide-react'

const REACTIONS = [
  { type: 'like', emoji: '👍', label: '讚', color: 'text-blue-400' },
  { type: 'love', emoji: '❤️', label: '愛心', color: 'text-red-400' },
  { type: 'haha', emoji: '😂', label: '哈哈', color: 'text-amber-400' },
  { type: 'wow', emoji: '😮', label: '哇', color: 'text-amber-400' },
  { type: 'sad', emoji: '😢', label: '悲傷', color: 'text-blue-300' },
  { type: 'angry', emoji: '😠', label: '生氣', color: 'text-red-500' },
]

interface InteractionBarProps {
  postId: string
  initialLikes?: number
  initialComments?: number
  initialMyReaction?: string | null
  initialIsBookmarked?: boolean
  onCommentClick?: () => void
  onBookmarkChange?: (isBookmarked: boolean) => void
  onCommentAdded?: () => void
  shareUrl?: string
  shareTitle?: string
  compact?: boolean
  className?: string
  onShareClick?: () => void
}

export function InteractionBar({
  postId,
  initialLikes = 0,
  initialComments = 0,
  initialMyReaction = null,
  initialIsBookmarked = false,
  onCommentClick,
  onBookmarkChange,
  onCommentAdded,
  shareUrl,
  shareTitle,
  compact = false,
  className = '',
  onShareClick,
}: InteractionBarProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [myReaction, setMyReaction] = useState<string | null>(initialMyReaction)
  const [likesCount, setLikesCount] = useState(initialLikes)
  const [commentsCount, setCommentsCount] = useState(initialComments)
  const [isPending, setIsPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)

  useEffect(() => { setCommentsCount(initialComments) }, [initialComments])
  const hoverRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isLongRef = useRef(false)

  const currentReaction = REACTIONS.find(r => r.type === myReaction)

  const handleReaction = useCallback(async (type: string) => {
    setIsPending(true)
    setShowReactions(false)
    const prevReaction = myReaction
    const prevCount = likesCount

    if (myReaction === type) {
      setMyReaction(null)
      setLikesCount(c => Math.max(0, c - 1))
    } else {
      if (!myReaction) setLikesCount(c => c + 1)
      setMyReaction(type)
    }

    try {
      const res = await fetch('/api/admin/social/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type }),
      })
      const data = await res.json() as { likesCount: number }
      if (res.ok) setLikesCount(data.likesCount)
    } catch {
      setMyReaction(prevReaction)
      setLikesCount(prevCount)
    } finally {
      setIsPending(false)
    }
  }, [postId, myReaction, likesCount])

  const handleShare = useCallback(async () => {
    if (onShareClick) {
      onShareClick()
      return
    }
    const url = shareUrl ?? window.location.href
    if (navigator.share) {
      navigator.share({ title: shareTitle, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl, shareTitle, onShareClick])

  const handleBookmark = useCallback(async () => {
    const next = !isBookmarked
    setIsBookmarked(next)
    try {
      const res = await fetch('/api/admin/social/bookmarks', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      if (!res.ok) setIsBookmarked(!next)
      else onBookmarkChange?.(next)
    } catch {
      setIsBookmarked(!next)
    }
  }, [postId, isBookmarked, onBookmarkChange])

  // 共用 idle 按鈕樣式（使用 CSS 變數，適配淺/深色背景）
  const idleBtn = 'text-[var(--sc-fg-muted)] hover:bg-[var(--sc-hover-bg)] hover:text-[var(--sc-fg)]'

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <button onClick={() => handleReaction('like')} disabled={isPending}
          className={`flex items-center gap-1 text-xs transition-colors ${myReaction ? 'text-red-400' : 'text-[var(--sc-fg-muted)] hover:text-red-400'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${myReaction ? 'fill-red-400' : ''}`} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>
        <button onClick={onCommentClick}
          className="flex items-center gap-1 text-xs text-[var(--sc-fg-muted)] hover:text-blue-400 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {commentsCount > 0 && <span>{commentsCount}</span>}
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between py-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {/* Reaction button */}
        <div className="relative"
          onMouseEnter={() => { clearTimeout(hoverRef.current); setShowReactions(true) }}
          onMouseLeave={() => { hoverRef.current = setTimeout(() => setShowReactions(false), 300) }}
        >
          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-white/10 rounded-full px-2 py-1.5 flex gap-1 shadow-xl z-50"
              onMouseEnter={() => clearTimeout(hoverRef.current)}
              onMouseLeave={() => { hoverRef.current = setTimeout(() => setShowReactions(false), 300) }}
            >
              {REACTIONS.map(r => (
                <button key={r.type} onClick={() => handleReaction(r.type)}
                  title={r.label}
                  className="text-lg hover:scale-125 transition-transform leading-none p-1 rounded-full hover:bg-white/10"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button
            disabled={isPending}
            onClick={() => { if (!isLongRef.current) handleReaction('like'); isLongRef.current = false }}
            onTouchStart={() => { isLongRef.current = false; longRef.current = setTimeout(() => { isLongRef.current = true; setShowReactions(true) }, 500) }}
            onTouchEnd={() => clearTimeout(longRef.current)}
            onContextMenu={e => e.preventDefault()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              myReaction
                ? `${currentReaction?.color ?? 'text-blue-400'} bg-blue-500/10 hover:bg-blue-500/20`
                : idleBtn
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : myReaction ? (
              <><span className="text-base leading-none">{currentReaction?.emoji}</span><span>{currentReaction?.label}</span></>
            ) : (
              <><ThumbsUp className="w-4 h-4" /><span>讚</span></>
            )}
            {likesCount > 0 && (
              <span className="text-xs bg-[var(--sc-badge-bg)] px-1.5 rounded-full ml-0.5">{likesCount}</span>
            )}
          </button>
        </div>

        <button onClick={onCommentClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${idleBtn}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>留言</span>
          {initialComments > 0 && (
            <span className="text-xs bg-[var(--sc-badge-bg)] px-1.5 rounded-full">{initialComments}</span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            isBookmarked ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : idleBtn
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          <span>{isBookmarked ? '已收藏' : '收藏'}</span>
        </button>

        <button onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${idleBtn}`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? '已複製' : '分享'}</span>
        </button>
      </div>
    </div>
  )
}

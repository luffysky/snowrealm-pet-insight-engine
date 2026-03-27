'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Reply, Trash2, Loader2, Smile, X, ChevronDown, ChevronUp } from 'lucide-react'
import { GifPicker } from './GifPicker'
import type { SocialComment } from '@/lib/socialEngine'

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '🎉', '🙏', '🔥', '👏']

interface CommentSectionProps {
  postId: string
  currentUserId?: string
  className?: string
  onCommentAdded?: () => void
}

interface CommentInputProps {
  postId: string
  parentId?: string
  currentUserId?: string
  onSubmitted: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

function CommentInput({ postId, parentId, onSubmitted, onCancel, placeholder, autoFocus }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [showGif, setShowGif] = useState(false)
  const [sending, setSending] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (autoFocus) textRef.current?.focus() }, [autoFocus])

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji)
    textRef.current?.focus()
  }

  const submit = async () => {
    if (!content.trim() && !gifUrl) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: content.trim() || ' ', gifUrl, parentId }),
      })
      if (res.ok) {
        setContent('')
        setGifUrl(null)
        onSubmitted()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
          placeholder={placeholder ?? '寫留言...'}
          rows={2}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/30 resize-none"
        />
      </div>
      {gifUrl && (
        <div className="relative inline-block">
          <img src={gifUrl} alt="GIF" className="h-24 rounded-lg" />
          <button onClick={() => setGifUrl(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white/60" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => insertEmoji(e)} className="text-sm hover:scale-110 transition-transform p-0.5 rounded">
                {e}
              </button>
            ))}
          </div>
          <div className="relative">
            <button onClick={() => setShowGif(s => !s)}
              className="ml-1 px-2 py-1 text-xs text-white/40 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-colors font-medium"
            >
              GIF
            </button>
            {showGif && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <GifPicker onSelect={url => { setGifUrl(url); setShowGif(false) }} onClose={() => setShowGif(false)} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 transition-colors">取消</button>
          )}
          <button
            onClick={submit}
            disabled={sending || (!content.trim() && !gifUrl)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            發送
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  onDeleted,
  onReply,
}: {
  comment: SocialComment
  postId: string
  currentUserId?: string
  onDeleted: () => void
  onReply: (parentId: string) => void
}) {
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const isOwner = currentUserId === comment.userId

  const handleDelete = async () => {
    if (!confirm('確定刪除這則留言？')) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/social/comments/${comment.id}`, { method: 'DELETE' })
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const initials = (comment.authorName ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-semibold text-white/80 overflow-hidden">
          {comment.authorAvatar
            ? <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white/4 rounded-xl px-3 py-2">
            <p className="text-xs font-semibold text-white/70 mb-0.5">{comment.authorName ?? '用戶'}</p>
            <p className="text-sm text-white/80 break-words whitespace-pre-wrap">{comment.content.trim()}</p>
            {comment.gifUrl && (
              <img src={comment.gifUrl} alt="GIF" className="mt-1.5 h-20 rounded-lg" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-white/25">
              {new Date(comment.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <button onClick={() => setReplying(s => !s)} className="text-[11px] text-white/30 hover:text-amber-300 transition-colors font-medium">
              回覆
            </button>
            {isOwner && (
              <button onClick={handleDelete} disabled={deleting} className="text-[11px] text-white/20 hover:text-red-400 transition-colors">
                {deleting ? '刪除中...' : '刪除'}
              </button>
            )}
          </div>
        </div>
      </div>

      {replying && (
        <div className="pl-9">
          <CommentInput
            postId={postId}
            parentId={comment.id}
            onSubmitted={() => { setReplying(false); onReply(comment.id) }}
            onCancel={() => setReplying(false)}
            placeholder={`回覆 ${comment.authorName ?? '用戶'}...`}
            autoFocus
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-9 space-y-2">
          <button onClick={() => setShowReplies(s => !s)}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {comment.replies.length} 則回覆
          </button>
          {showReplies && comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-2">
              <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-[10px] font-semibold text-white/70 overflow-hidden">
                {reply.authorAvatar
                  ? <img src={reply.authorAvatar} alt="" className="w-full h-full object-cover" />
                  : (reply.authorName ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="bg-white/4 rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold text-white/60 mb-0.5">{reply.authorName ?? '用戶'}</p>
                  <p className="text-sm text-white/80 break-words whitespace-pre-wrap">{reply.content.trim()}</p>
                  {reply.gifUrl && <img src={reply.gifUrl} alt="GIF" className="mt-1.5 h-16 rounded-lg" />}
                </div>
                <p className="text-[10px] text-white/20 mt-0.5 px-1">
                  {new Date(reply.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentSection({ postId, currentUserId, className = '', onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<SocialComment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTarget, setReplyTarget] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/social/comments?postId=${postId}`)
      if (res.ok) {
        const data = await res.json() as { comments: SocialComment[] }
        setComments(data.comments)
      }
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { loadComments() }, [loadComments])

  return (
    <div className={`space-y-4 ${className}`}>
      <CommentInput postId={postId} onSubmitted={() => { loadComments(); onCommentAdded?.() }} />
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-white/20 text-sm py-4">還沒有留言，來搶首留！</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              currentUserId={currentUserId}
              onDeleted={loadComments}
              onReply={() => { setReplyTarget(null); loadComments() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

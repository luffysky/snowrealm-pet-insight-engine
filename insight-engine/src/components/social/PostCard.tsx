'use client'

import { useState, useRef } from 'react'
import { MoreHorizontal, Trash2, Share2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import { InteractionBar } from './InteractionBar'
import { CommentSection } from './CommentSection'
import { FollowButton } from './FollowButton'
import { DMButton } from './DMButton'
import { SharePostModal } from './SharePostModal'
import { EditPostModal } from './EditPostModal'
import { TranslateBar } from './TranslateBar'
import { ReportButton } from './ReportButton'
import { parseArticleContent } from './ArticleEditor'
import type { SocialPost } from '@/lib/socialEngine'

interface PostCardProps {
  post: SocialPost
  currentUserId?: string
  onDeleted?: (postId: string) => void
  showComments?: boolean
  baseUrl?: string
}

export function PostCard({ post, currentUserId, onDeleted, showComments = false, baseUrl = '' }: PostCardProps) {
  const [currentPost, setCurrentPost] = useState(post)
  const [expanded, setExpanded] = useState(showComments)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
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

  const initials = (currentPost.authorName ?? '?').slice(0, 2).toUpperCase()
  const timeStr = new Date(currentPost.createdAt).toLocaleDateString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const hasImages = currentPost.images.length > 0

  // Plain text for translation
  const translateText = currentPost.type === 'article'
    ? parseArticleContent(currentPost.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : currentPost.content

  return (
    <article className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-3xl overflow-hidden hover:border-white/15 hover:bg-white/[0.06] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <a href={`?userId=${currentPost.userId}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 shrink-0 overflow-hidden hover:ring-2 hover:ring-amber-400/40 transition-all">
            {currentPost.authorAvatar
              ? <img src={currentPost.authorAvatar} alt="" className="w-full h-full object-cover" />
              : initials}
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`?userId=${currentPost.userId}`} className="text-sm font-semibold text-white/80 hover:text-white transition-colors">{currentPost.authorName ?? '用戶'}</a>
              {!isOwner && currentPost.userId && (
                <div className="flex items-center gap-1.5">
                  <FollowButton targetUserId={currentPost.userId} compact />
                  <DMButton targetUserId={currentPost.userId} targetName={currentPost.authorName ?? '用戶'} targetAvatar={currentPost.authorAvatar} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">{timeStr}</span>
              {currentPost.type === 'article' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">文章</span>
              )}
              {!currentPost.isPublic && (
                <span className="text-[10px] px-1.5 py-0.5 bg-white/8 text-white/30 rounded-full">私密</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {isOwner && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(s => !s)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 py-1 min-w-[120px]" onMouseLeave={() => setMenuOpen(false)}>
                  <button
                    onClick={() => { setEditing(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    編輯
                  </button>
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
          {/* Report — non-owner only */}
          {!isOwner && (
            <ReportButton
              targetType="post"
              targetId={post.id}
              targetContent={currentPost.content.slice(0, 200)}
              targetAuthorId={currentPost.userId}
              targetAuthorName={currentPost.authorName ?? undefined}
            />
          )}
        </div>
      </div>

      {/* Title (article) */}
      {currentPost.title && (
        <div className="px-4 pb-1">
          <h2 className="text-base font-bold text-white/90">{currentPost.title}</h2>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-2">
        {currentPost.type === 'article' ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed [&_p]:mb-2 [&_h1]:text-white/90 [&_h2]:text-white/80 [&_h3]:text-white/75 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-amber-400 [&_a:hover]:text-amber-300 [&_strong]:text-white/85 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-400/40 [&_blockquote]:pl-3 [&_blockquote]:text-white/50 [&_img]:rounded-xl [&_img]:max-h-64 [&_img]:object-cover [&_mark]:bg-amber-400/20 [&_mark]:text-amber-200 [&_mark]:rounded-sm"
            dangerouslySetInnerHTML={{ __html: parseArticleContent(currentPost.content) }}
          />
        ) : (
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
            {currentPost.content}
          </p>
        )}
      </div>

      {/* Tags */}
      {currentPost.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {currentPost.tags.map(t => (
            <span key={t} className="text-xs text-amber-400/60 hover:text-amber-300 cursor-pointer">#{t}</span>
          ))}
        </div>
      )}

      {/* Images carousel */}
      {hasImages && (
        <div className="relative bg-black/20">
          <div className={`${currentPost.images.length === 1 ? '' : 'overflow-hidden'}`}>
            <img
              src={currentPost.images[imgIdx]?.url}
              alt={currentPost.images[imgIdx]?.alt ?? ''}
              className="w-full max-h-80 object-cover"
            />
          </div>
          {currentPost.images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} disabled={imgIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx(i => Math.min(currentPost.images.length - 1, i + 1))} disabled={imgIdx === currentPost.images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {currentPost.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Translate */}
      <div className="px-4 pb-2">
        <TranslateBar text={translateText} />
      </div>

      {/* Interaction bar */}
      <div className="px-4 border-t border-white/5">
        <InteractionBar
          postId={post.id}
          initialLikes={currentPost.likesCount}
          initialComments={currentPost.commentsCount}
          initialMyReaction={currentPost.myReaction}
          initialIsBookmarked={currentPost.isBookmarked}
          onCommentClick={() => setExpanded(s => !s)}
          shareUrl={typeof window !== 'undefined' ? window.location.origin + postUrl : postUrl}
          shareTitle={currentPost.title ?? currentPost.content.slice(0, 80)}
          onShareClick={() => setShowShareModal(true)}
        />
      </div>

      {/* Comments */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <SharePostModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={currentPost}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <EditPostModal
          post={currentPost}
          onClose={() => setEditing(false)}
          onSaved={updated => { setCurrentPost(updated); setEditing(false) }}
        />
      )}
    </article>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock, Eye, ExternalLink, Check, Loader2, Download, X } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import { InteractionBar } from '@/components/social/InteractionBar'
import { CommentSection } from '@/components/social/CommentSection'
import { FollowButton } from '@/components/social/FollowButton'
import { DMButton } from '@/components/social/DMButton'
import { PostShareCard } from '@/components/social/PostShareCard'
import type { SocialPost } from '@/lib/socialEngine'
import type { ArticleBlock } from '@/components/social/ArticleEditor'
import { VideoPlayer } from '@/components/public/VideoPlayer'
import { ImageCarousel } from '@/components/social/ImageCarousel'

function BlocksRenderer({ blocks, onImageClick }: { blocks: ArticleBlock[]; onImageClick?: (url: string) => void }) {
  return (
    <div className="space-y-4">
      {blocks.map(block => (
        <div key={block.id}>
          {block.type === 'text' && (
            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.textContent ?? '' }} />
          )}
          {block.type === 'image' && block.imageUrl && (
            <div className="space-y-1">
              <img src={block.imageUrl} alt={block.imageCaption ?? ''} className="w-full rounded-xl object-cover max-h-96 cursor-zoom-in"
                onClick={() => onImageClick?.(block.imageUrl!)} />
              {block.imageCaption && <p className="text-xs text-[#8a7ca8]/80 text-center">{block.imageCaption}</p>}
            </div>
          )}
          {(block.type === 'image-text' || block.type === 'text-image') && (
            <div className="grid grid-cols-2 gap-4 items-start">
              {block.type === 'image-text' ? (
                <>
                  {block.imageUrl && <img src={block.imageUrl} alt="" className="rounded-xl w-full object-cover cursor-zoom-in"
                    onClick={() => onImageClick?.(block.imageUrl!)} />}
                  <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.textContent ?? '' }} />
                </>
              ) : (
                <>
                  <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.textContent ?? '' }} />
                  {block.imageUrl && <img src={block.imageUrl} alt="" className="rounded-xl w-full object-cover cursor-zoom-in"
                    onClick={() => onImageClick?.(block.imageUrl!)} />}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ArticleDetailPage() {
  const { id } = useParams() as { id: string }
  const [post, setPost] = useState<SocialPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)
  const [commentsCount, setCommentsCount] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ id?: string }> : null)
      .then(d => { if (d?.id) setMeId(d.id) })
      .catch(() => {/* not logged in */})
  }, [])

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.ok ? r.json() as Promise<{ post: SocialPost }> : null)
      .then(d => { if (d?.post) { setPost(d.post); setCommentsCount(d.post.commentsCount) } })
      .finally(() => setLoading(false))
  }, [id])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center text-[#8a7ca8]">
      <div className="text-center space-y-3">
        <p className="text-4xl">😕</p>
        <p>文章不存在或已刪除</p>
        <Link href="/articles" className="text-amber-400 hover:text-amber-300 text-sm underline">← 回到文章列表</Link>
      </div>
    </div>
  )

  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()
  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="min-h-screen bg-transparent text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      {/* Image lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 p-2 text-[#6b5fa8] hover:text-[#3d3155] bg-white/10 rounded-full" onClick={() => setLightboxUrl(null)}>
            <X className="w-5 h-5" />
          </button>
          <a href={lightboxUrl} download className="absolute top-4 right-16 p-2 text-[#6b5fa8] hover:text-[#3d3155] bg-white/10 rounded-full" title="下載圖片" onClick={e => e.stopPropagation()}>
            <Download className="w-5 h-5" />
          </a>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
      {/* Share card */}
      {showShareCard && <PostShareCard post={post} onClose={() => setShowShareCard(false)} />}

      {/* Back nav */}
      <nav className="sticky top-0 z-10 bg-transparent/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/articles" className="flex items-center gap-2 text-sm text-[#6b5fa8] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 社群文章
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowShareCard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-xs text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              📤 分享
            </button>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-[#6b5fa8] hover:text-[#3d3155] hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? '已複製' : '連結'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero video */}
        {post.videoUrl && (
          <div className="rounded-2xl overflow-hidden">
            <VideoPlayer
              src={post.videoUrl}
              thumbnail={post.videoThumbnailUrl}
              className="w-full"
            />
          </div>
        )}

        {/* Hero images carousel (only if no video) */}
        {!post.videoUrl && post.images.length > 0 && (
          <ImageCarousel
            images={post.images}
            aspectRatio="video"
            onImageClick={setLightboxUrl}
          />
        )}

        {/* Article header */}
        <div className="space-y-4">
          {post.type === 'article' && post.title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{post.title}</h1>
          )}

          {/* Author + meta */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
              {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#3d3155]">{post.authorName ?? '用戶'}</p>
              <div className="flex items-center gap-2 text-xs text-[#8a7ca8]/75">
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {timeStr}</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.viewsCount} 閱讀</span>
              </div>
            </div>
            {meId && meId !== post.userId && (
              <div className="flex items-center gap-2">
                {!post.isFollowing && <FollowButton targetUserId={post.userId} initialFollowing={false} />}
                <DMButton targetUserId={post.userId} targetName={post.authorName ?? '用戶'} targetAvatar={post.authorAvatar} />
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <Link key={t} href={`/articles?tag=${t}`}
                  className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-400/20 rounded-full text-amber-400/70 hover:text-amber-300 transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Content — blocks or plain text */}
        {(() => {
          let blocks: ArticleBlock[] | null = null
          try { blocks = JSON.parse(post.content) as ArticleBlock[]; if (!Array.isArray(blocks)) blocks = null } catch { blocks = null }
          return blocks ? (
            <BlocksRenderer blocks={blocks} onImageClick={setLightboxUrl} />
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none prose-p:text-[#3d3155]/85 prose-img:rounded-xl prose-img:w-full prose-img:max-h-80 prose-img:object-cover prose-img:cursor-zoom-in"
              dangerouslySetInnerHTML={{ __html: post.content }}
              onClick={e => {
                const target = e.target as HTMLElement
                if (target.tagName === 'IMG') setLightboxUrl((target as HTMLImageElement).src)
              }}
            />
          )
        })()}


        {/* Interaction */}
        <div className="border-t border-white/8 pt-4">
          <InteractionBar
            postId={post.id}
            initialLikes={post.likesCount}
            initialComments={commentsCount}
            initialMyReaction={post.myReaction}
            onCommentClick={() => setCommentsOpen(s => !s)}
            onShareClick={() => setShowShareCard(true)}
            shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
            shareTitle={post.title ?? post.content.slice(0, 80)}
          />
        </div>

        {/* Comments */}
        {commentsOpen && (
          <div className="border-t border-white/8 pt-4">
            <h3 className="text-sm font-semibold text-[#6b5fa8] mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 留言 ({commentsCount})
            </h3>
            <CommentSection postId={post.id} onCommentAdded={() => setCommentsCount(c => c + 1)} />
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-600/10 to-purple-600/10 border border-amber-400/15 rounded-2xl p-6 text-center space-y-3">
          <p className="text-[#6b5fa8] text-sm">喜歡這篇文章？試試用 AI 問卷發現更多洞察</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors">
            ✨ 免費開始使用
          </Link>
        </div>
      </div>
    </div>
  )
}

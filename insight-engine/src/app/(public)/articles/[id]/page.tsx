'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock, Eye, ExternalLink, Check, Loader2 } from 'lucide-react'
const TwitterIcon = ({ className }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)
import { InteractionBar } from '@/components/social/InteractionBar'
import { CommentSection } from '@/components/social/CommentSection'
import type { SocialPost } from '@/lib/socialEngine'

export default function ArticleDetailPage() {
  const { id } = useParams() as { id: string }
  const [post, setPost] = useState<SocialPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.ok ? r.json() as Promise<{ post: SocialPost }> : null)
      .then(d => { if (d?.post) setPost(d.post) })
      .finally(() => setLoading(false))
  }, [id])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/40">
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Back nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/articles" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 社群文章
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? '已複製' : '複製連結'}
            </button>
            <button
              onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`)}
              className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/20 rounded-xl text-xs text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              💬 LINE 分享
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title ?? post.content.slice(0, 80))}`)}
              className="px-3 py-1.5 bg-blue-500/15 border border-blue-400/20 rounded-xl text-xs text-blue-400 hover:bg-blue-500/25 transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5 inline -mt-0.5" /> Twitter
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero image */}
        {post.images.length > 0 && (
          <div className="rounded-2xl overflow-hidden max-h-80">
            <img src={post.images[0].url} alt="" className="w-full h-full object-cover" />
          </div>
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
            <div>
              <p className="text-sm font-semibold text-white/80">{post.authorName ?? '用戶'}</p>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {timeStr}</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.viewsCount} 閱讀</span>
              </div>
            </div>
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

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-white/75 leading-relaxed whitespace-pre-wrap text-base">{post.content}</p>
        </div>

        {/* More images */}
        {post.images.length > 1 && (
          <div className={`grid gap-2 ${post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {post.images.slice(1).map((img, i) => (
              <img key={i} src={img.url} alt={img.alt ?? ''} className="rounded-xl object-cover aspect-square w-full" />
            ))}
          </div>
        )}

        {/* Interaction */}
        <div className="border-t border-white/8 pt-4">
          <InteractionBar
            postId={post.id}
            initialLikes={post.likesCount}
            initialComments={post.commentsCount}
            initialMyReaction={post.myReaction}
            onCommentClick={() => setCommentsOpen(s => !s)}
            shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
            shareTitle={post.title ?? post.content.slice(0, 80)}
          />
        </div>

        {/* Comments */}
        {commentsOpen && (
          <div className="border-t border-white/8 pt-4">
            <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 留言 ({post.commentsCount})
            </h3>
            <CommentSection postId={post.id} />
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-600/10 to-purple-600/10 border border-amber-400/15 rounded-2xl p-6 text-center space-y-3">
          <p className="text-white/60 text-sm">喜歡這篇文章？試試用 AI 問卷發現更多洞察</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors">
            ✨ 免費開始使用
          </Link>
        </div>
      </div>
    </div>
  )
}

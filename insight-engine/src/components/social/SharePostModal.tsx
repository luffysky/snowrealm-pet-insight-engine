'use client'

import { useRef, useState, useCallback } from 'react'
import { X, Download, Copy, Check } from 'lucide-react'
import type { SocialPost } from '@/lib/socialEngine'

interface SharePostModalProps {
  open: boolean
  onClose: () => void
  post: SocialPost
}

export function SharePostModal({ open, onClose, post }: SharePostModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${post.id}`

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [postUrl])

  const shareToLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(postUrl)}`, '_blank')
  }

  const saveImage = useCallback(async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      // @ts-expect-error html2canvas is optionally loaded
      if (typeof window !== 'undefined' && window.html2canvas) {
        // @ts-expect-error html2canvas is optionally loaded
        const canvas = await window.html2canvas(cardRef.current, { scale: 2, backgroundColor: '#0f172a', useCORS: true }) as HTMLCanvasElement
        const link = document.createElement('a')
        link.download = `post-${post.id.slice(0, 8)}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        await navigator.clipboard.writeText(postUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }, [post.id, postUrl])

  if (!open) return null

  const timeStr = new Date(post.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
  const snippet = post.type === 'article'
    ? post.content.replace(/<[^>]+>/g, '').slice(0, 200)
    : post.content.slice(0, 200)
  const displayName = post.authorName ?? '用戶'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-base font-semibold text-white/90">分享貼文</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share card preview */}
        <div className="p-4">
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1a0a2e 100%)' }}
          >
            {/* Card header gradient bar */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500" />

            <div className="p-5">
              {/* Author row */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/40 to-purple-500/40 flex items-center justify-center text-sm font-bold text-white/90 overflow-hidden shrink-0">
                  {post.authorAvatar
                    ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/85">{displayName}</p>
                  <p className="text-[10px] text-white/35">{timeStr}</p>
                </div>
                {post.type === 'article' && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium border border-blue-400/20">文章</span>
                )}
              </div>

              {/* Title */}
              {post.title && (
                <h2 className="text-base font-bold text-white/90 mb-2 leading-snug">{post.title}</h2>
              )}

              {/* Content snippet */}
              <p className="text-sm text-white/60 leading-relaxed line-clamp-4">
                {snippet}{snippet.length >= 200 ? '...' : ''}
              </p>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.slice(0, 4).map(t => (
                    <span key={t} className="text-xs text-amber-400/60">#{t}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/8">
                <div className="flex items-center gap-3 text-xs text-white/25">
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/20">✦</span>
                  <span className="text-[10px] text-white/30 font-medium">Insight Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={saveImage}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/8 border border-white/12 rounded-xl text-sm text-white/70 hover:bg-white/12 hover:text-white transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              儲存圖片
            </button>
            <button
              onClick={shareToLine}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 border border-emerald-400/20 rounded-xl text-sm text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >
              <span>💬</span>
              LINE 分享
            </button>
          </div>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/15 border border-amber-400/20 rounded-xl text-sm text-amber-300 hover:bg-amber-500/25 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '已複製連結！' : '複製連結'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { X, Download, Copy, Check, Sliders } from 'lucide-react'
import type { SocialPost } from '@/lib/socialEngine'

interface PostShareCardProps {
  post: SocialPost
  onClose: () => void
}

export function PostShareCard({ post, onClose }: PostShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [adjustMode, setAdjustMode] = useState(false)
  // Image position as percentage (0-100)
  const [imgPos, setImgPos] = useState({ x: 50, y: 50 })
  // Drag state for image repositioning
  const imgDrag = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/articles/${post.id}`
    : `/articles/${post.id}`

  // Proxy image through Next.js to avoid CORS issues with R2/S3
  const proxyImg = (url: string) =>
    url.startsWith('data:') ? url : `/api/img-proxy?url=${encodeURIComponent(url)}`

  const dateStr = new Date(post.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const excerpt = post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content

  const handleSave = async () => {
    if (!cardRef.current || saving) return
    setSaving(true)
    setAdjustMode(false)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `post-${post.id.slice(0, 8)}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('[PostShareCard] 儲存失敗:', err)
      alert('儲存圖片失敗，請嘗試長按圖片另存')
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initials = (post.authorName ?? '?').slice(0, 2).toUpperCase()

  // Drag handlers for image repositioning
  const onImgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!adjustMode) return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    imgDrag.current = { startX: e.clientX, startY: e.clientY, startPosX: imgPos.x, startPosY: imgPos.y }
  }

  const onImgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imgDrag.current) return
    const dx = (e.clientX - imgDrag.current.startX) / 3
    const dy = (e.clientY - imgDrag.current.startY) / 3
    setImgPos({
      x: Math.max(0, Math.min(100, imgDrag.current.startPosX - dx)),
      y: Math.max(0, Math.min(100, imgDrag.current.startPosY - dy)),
    })
  }

  const onImgPointerUp = () => { imgDrag.current = null }

  const hasImage = post.images.length > 0

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>

        {/* Card to save */}
        <div ref={cardRef}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/40 to-purple-500/40 flex items-center justify-center text-sm font-bold text-white/90 overflow-hidden shrink-0">
              {post.authorAvatar
                ? <img src={proxyImg(post.authorAvatar)} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                : initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/85">{post.authorName ?? '用戶'}</p>
              <p className="text-[11px] text-white/35">{dateStr}</p>
            </div>
          </div>

          {/* Post image — adjustable */}
          {hasImage && (
            <div
              className={`relative rounded-xl overflow-hidden h-48 ${adjustMode ? 'ring-2 ring-amber-400/50 cursor-move' : ''}`}
              onPointerDown={onImgPointerDown}
              onPointerMove={onImgPointerMove}
              onPointerUp={onImgPointerUp}
              style={{ touchAction: adjustMode ? 'none' : 'auto' }}
            >
              <img
                src={proxyImg(post.images[0].url)}
                alt=""
                crossOrigin="anonymous"
                className="w-full h-full object-cover select-none"
                style={{ objectPosition: `${imgPos.x}% ${imgPos.y}%` }}
                draggable={false}
              />
              {adjustMode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/40 rounded-xl px-3 py-1.5 text-xs text-white/80">拖曳調整圖片位置</div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          {post.title && (
            <p className="text-base font-bold text-white/90 leading-snug">{post.title}</p>
          )}

          {/* Content */}
          <p className="text-sm text-white/65 leading-relaxed">{excerpt}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-white/30 border-t border-white/8 pt-3">
            <span>❤️ {post.likesCount}</span>
            <span>💬 {post.commentsCount}</span>
            {post.tags.length > 0 && (
              <span className="text-amber-400/50">#{post.tags[0]}</span>
            )}
          </div>

          {/* Branding */}
          <div className="flex items-center justify-between pt-1 border-t border-white/6">
            <span className="text-[10px] text-white/20">SnowRealm Insight Engine</span>
            <span className="text-[10px] text-white/15">{postUrl.replace('https://', '')}</span>
          </div>
        </div>

        {/* Adjust controls — shown in adjust mode */}
        {adjustMode && hasImage && (
          <div className="bg-slate-900/95 border border-white/10 rounded-2xl px-4 py-3 space-y-2.5">
            <p className="text-xs text-white/50 font-medium">調整圖片位置</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/35 w-8">左右</span>
              <input
                type="range" min={0} max={100} value={imgPos.x}
                onChange={e => setImgPos(p => ({ ...p, x: Number(e.target.value) }))}
                className="flex-1 accent-amber-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/35 w-8">上下</span>
              <input
                type="range" min={0} max={100} value={imgPos.y}
                onChange={e => setImgPos(p => ({ ...p, y: Number(e.target.value) }))}
                className="flex-1 accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-2xl text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {saving ? '處理中...' : adjustMode ? '確認儲存' : '儲存圖片'}
          </button>
          {hasImage && (
            <button
              onClick={() => setAdjustMode(m => !m)}
              className={`py-2.5 px-3 border rounded-2xl text-sm transition-colors ${
                adjustMode
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  : 'bg-white/8 border-white/12 text-white/50 hover:bg-white/12'
              }`}
              title="調整圖片位置"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/8 border border-white/12 text-white/60 rounded-2xl text-sm hover:bg-white/12 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '已複製' : '複製連結'}
          </button>
          <button
            onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(postUrl)}`)}
            className="py-2.5 px-3 bg-emerald-500/20 border border-emerald-400/20 text-emerald-400 rounded-2xl text-sm hover:bg-emerald-500/30 transition-colors"
          >
            💬
          </button>
          <button onClick={onClose}
            className="py-2.5 px-3 bg-white/5 border border-white/10 text-white/40 rounded-2xl text-sm hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

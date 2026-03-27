'use client'

import { useState, useRef } from 'react'
import { X, Image, Video, Tag, Send, Loader2, AlertCircle } from 'lucide-react'
import type { SocialPost } from '@/lib/socialEngine'

interface Props {
  onClose: () => void
  onCreated: (post: SocialPost) => void
}

interface UploadedImage {
  url: string
  preview: string
}

interface UploadedVideo {
  videoUrl: string
  thumbnailUrl: string
  duration: number
  preview: string
}

export function CreatePostModal({ onClose, onCreated }: Props) {
  const [type, setType] = useState<'post' | 'article'>('post')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [video, setVideo] = useState<UploadedVideo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  async function handleImageSelect(files: FileList | null) {
    if (!files || files.length === 0) return
    if (images.length + files.length > 4) {
      setError('最多上傳 4 張圖片')
      return
    }
    setUploading(true)
    setUploadProgress('上傳圖片中...')
    setError('')
    try {
      const results: UploadedImage[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload/media', { method: 'POST', body: fd })
        const data = await res.json() as { url?: string; error?: string }
        if (!res.ok || !data.url) throw new Error(data.error ?? '上傳失敗')
        results.push({ url: data.url, preview: URL.createObjectURL(file) })
      }
      setImages(prev => [...prev, ...results])
    } catch (err) {
      setError(err instanceof Error ? err.message : '圖片上傳失敗')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  async function handleVideoSelect(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]

    // Client-side duration check via HTML5 video
    const checkDuration = (): Promise<number> =>
      new Promise((resolve) => {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => { resolve(v.duration); URL.revokeObjectURL(v.src) }
        v.onerror = () => resolve(0)
        v.src = URL.createObjectURL(file)
      })

    const dur = await checkDuration()
    if (dur > 32) {
      setError(`影片長度不能超過 30 秒（目前 ${Math.round(dur)} 秒）`)
      return
    }

    setUploading(true)
    setUploadProgress('壓縮上傳影片中...')
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/video', { method: 'POST', body: fd })
      const data = await res.json() as { videoUrl?: string; thumbnailUrl?: string; duration?: number; error?: string }
      if (!res.ok || !data.videoUrl) throw new Error(data.error ?? '影片上傳失敗')
      setVideo({
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl ?? '',
        duration: data.duration ?? 0,
        preview: URL.createObjectURL(file),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '影片上傳失敗')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (!t || tags.includes(t) || tags.length >= 5) return
    setTags(prev => [...prev, t])
    setTagInput('')
  }

  async function handleSubmit() {
    if (!content.trim()) { setError('請輸入內容'); return }
    setSubmitting(true)
    setError('')
    try {
      const body = {
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        images: images.map(i => ({ url: i.url })),
        videoUrl: video?.videoUrl,
        videoThumbnailUrl: video?.thumbnailUrl,
        tags,
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { post?: SocialPost; error?: string }
      if (!res.ok || !data.post) throw new Error(data.error ?? '發文失敗')
      onCreated(data.post)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '發文失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setType('post')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'post' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'text-white/40 hover:text-white/70'}`}
            >
              💬 短貼文
            </button>
            <button
              onClick={() => setType('article')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'article' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'text-white/40 hover:text-white/70'}`}
            >
              📝 長文章
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title (article only) */}
          {type === 'article' && (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="文章標題..."
              maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-base font-medium focus:outline-none focus:border-white/20"
            />
          )}

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={type === 'post' ? '分享你的想法...' : '寫下你的文章內容...'}
            rows={type === 'article' ? 8 : 4}
            maxLength={5000}
            className="w-full bg-transparent text-white/90 placeholder-white/30 text-sm leading-relaxed resize-none focus:outline-none"
          />

          {/* Uploaded images preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded video preview */}
          {video && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video src={video.preview} poster={video.thumbnailUrl} controls className="w-full h-full object-contain" />
              <button
                onClick={() => setVideo(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 text-xs text-white/50 bg-black/60 px-2 py-0.5 rounded-full">
                {video.duration}s
              </span>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-amber-300/80">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              {uploadProgress}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                placeholder="新增標籤（Enter 確認）"
                className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/30 focus:outline-none"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-white/8 border border-white/10 text-amber-300/70 rounded-full px-2 py-0.5">
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-white/30 hover:text-white/60">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer toolbar */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/8 shrink-0">
          {/* Image upload */}
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageSelect(e.target.files)} />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || images.length >= 4 || !!video}
            className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="上傳圖片（最多 4 張）"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Video upload */}
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleVideoSelect(e.target.files)} />
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading || images.length > 0 || !!video}
            className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="上傳影片（30 秒以內）"
          >
            <Video className="w-5 h-5" />
          </button>

          <span className="text-xs text-white/20 ml-1">{content.length}/5000</span>

          <div className="flex-1" />

          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            發布
          </button>
        </div>
      </div>
    </div>
  )
}

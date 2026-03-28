'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Send, ImagePlus, X, Loader2, ArrowLeft, Hash } from 'lucide-react'

export default function QuickPostPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const imageRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textRef.current?.focus() }, [])

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return
    if (images.length >= 9) return
    setUploading(true)
    setError('')
    try {
      const remaining = 9 - images.length
      const toUpload = Array.from(files).slice(0, remaining)
      const urls = await Promise.all(toUpload.map(async f => {
        const fd = new FormData()
        fd.append('file', f)
        const res = await fetch('/api/upload/media', { method: 'POST', body: fd })
        const data = await res.json() as { url?: string; error?: string }
        if (!data.url) throw new Error(data.error ?? '上傳失敗')
        return data.url
      }))
      setImages(prev => [...prev, ...urls])
    } catch {
      setError('圖片上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      setError('請輸入內容或上傳圖片')
      return
    }
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'post',
          content: content.trim(),
          images: images.map((url, i) => ({ url, alt: i === 0 ? content.slice(0, 50) : '' })),
          tags,
          isPublic: true,
        }),
      })
      const data = await res.json() as { post?: { id: string }; error?: string }
      if (!res.ok || !data.post) throw new Error(data.error ?? '發布失敗')
      router.push(`/articles/${data.post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '發布失敗')
    } finally {
      setPosting(false)
    }
  }

  const charCount = content.length
  const charLimit = 1000

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-white/80">發布短貼文</p>
        <button
          onClick={() => void handlePost()}
          disabled={posting || uploading || (!content.trim() && images.length === 0)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold rounded-full text-sm transition-colors"
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          發布
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value.slice(0, charLimit))}
          placeholder="說些什麼吧..."
          rows={6}
          className="w-full bg-transparent text-white/90 placeholder-white/25 resize-none outline-none text-base leading-relaxed"
        />

        {/* Images */}
        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : images.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {images.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-slate-800">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {(tags.length > 0 || tagInput) && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full">
                #{t}
                <button onClick={() => setTags(prev => prev.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Bottom toolbar */}
      <div className="sticky bottom-0 border-t border-white/8 bg-slate-950/90 backdrop-blur-sm px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <input
            ref={imageRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => void uploadImages(e.target.files)}
          />
          <button
            onClick={() => imageRef.current?.click()}
            disabled={uploading || images.length >= 9}
            className="p-2 text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
            title="上傳圖片"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          </button>
          <div className="flex-1 relative">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder={tags.length < 5 ? '# 加入標籤（Enter 確認）' : '最多 5 個標籤'}
              disabled={tags.length >= 5}
              className="w-full px-3 py-1.5 bg-slate-800/60 border border-white/8 rounded-full text-sm text-white/70 placeholder-white/25 outline-none focus:border-amber-500/30 disabled:opacity-40"
            />
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none hidden" />
          </div>
          <span className={`text-xs tabular-nums ${charCount > charLimit * 0.9 ? 'text-amber-400' : 'text-white/25'}`}>
            {charCount}/{charLimit}
          </span>
        </div>
      </div>
    </div>
  )
}

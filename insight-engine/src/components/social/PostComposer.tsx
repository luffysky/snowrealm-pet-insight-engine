'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, Film, Send, X, Loader2, Tag, Globe, Lock } from 'lucide-react'
import { GifPicker } from './GifPicker'
import { ImagePicker } from './ImagePicker'
import { ArticleEditor, blocksToHtml, type ArticleBlock } from './ArticleEditor'
import type { SocialPost } from '@/lib/socialEngine'

type PostType = 'post' | 'article'

interface UploadedVideo {
  videoUrl: string
  thumbnailUrl: string
}

interface PostComposerProps {
  authorName?: string
  authorAvatar?: string
  tenantId?: string
  onPosted?: (post: SocialPost) => void
  defaultType?: PostType
  compact?: boolean
}

export function PostComposer({ authorName = '你', authorAvatar, onPosted, defaultType = 'post', compact = false }: PostComposerProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [type, setType] = useState<PostType>(defaultType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [blocks, setBlocks] = useState<ArticleBlock[]>([])
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([])
  const [video, setVideo] = useState<UploadedVideo | null>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [showGif, setShowGif] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const initials = authorName.slice(0, 2).toUpperCase()

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/media', { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    if (!data.url) throw new Error(data.error ?? '上傳失敗')
    return data.url
  }

  const handleVideoSelect = async (files: FileList | null) => {
    if (!files?.[0]) return
    const file = files[0]
    setVideoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/video', { method: 'POST', body: fd })
      const data = await res.json() as { videoUrl?: string; thumbnailUrl?: string; error?: string }
      if (!data.videoUrl) throw new Error(data.error ?? '影片上傳失敗')
      setVideo({ videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl ?? '' })
      setImages([])
    } finally {
      setVideoUploading(false)
    }
  }

  const addImage = (url: string) => {
    if (images.length >= 4) return
    setImages(prev => [...prev, { url }])
  }

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const submit = async () => {
    const isArticle = type === 'article'
    const articleContent = isArticle ? blocksToHtml(blocks) : content
    if (isArticle ? blocks.length === 0 : (!content.trim() && images.length === 0)) return
    setPosting(true)
    try {
      const res = await fetch('/api/admin/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, title: title.trim() || undefined, content: articleContent,
          images, videoUrl: video?.videoUrl, videoThumbnailUrl: video?.thumbnailUrl,
          tags, isPublic,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { post: SocialPost }
        setContent('')
        setTitle('')
        setBlocks([])
        setImages([])
        setVideo(null)
        setTags([])
        setExpanded(compact)
        onPosted?.(data.post)
      }
    } finally {
      setPosting(false)
    }
  }

  if (compact && !expanded) {
    return (
      <button onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] border border-white/10 rounded-2xl text-white/40 text-sm transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
          {authorAvatar ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <span>分享你的想法、問卷結果或靈感...</span>
      </button>
    )
  }

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-2xl p-4 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 shrink-0 overflow-hidden">
          {authorAvatar ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">{authorName}</span>
          {/* Type selector */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {(['post', 'article'] as PostType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${type === t ? 'bg-amber-500/20 text-amber-300' : 'text-white/30 hover:text-white/60'}`}
              >
                {t === 'post' ? '短貼文' : '長文章'}
              </button>
            ))}
          </div>
          {/* Public toggle */}
          <button onClick={() => setIsPublic(s => !s)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${
              isPublic ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-white/30'
            }`}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? '公開' : '私密'}
          </button>
        </div>
        {compact && (
          <button onClick={() => setExpanded(false)} className="ml-auto text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Title (article only) */}
      {type === 'article' && (
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="文章標題..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-base font-semibold text-white placeholder-white/20 outline-none focus:border-amber-400/30"
        />
      )}

      {/* Content */}
      {type === 'article' ? (
        <ArticleEditor blocks={blocks} onChange={setBlocks} onUpload={uploadImage} />
      ) : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="分享你的想法、問卷結果、靈感..."
          rows={3}
          className="w-full px-3 py-2 bg-transparent text-white/80 placeholder-white/25 outline-none resize-none text-sm leading-relaxed"
        />
      )}

      {/* Images preview */}
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {images.map((img, i) => (
            <div key={i} className={`relative rounded-xl overflow-hidden ${images.length === 1 ? 'max-h-64' : 'aspect-square'}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video preview */}
      {video && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-40">
          <video src={video.videoUrl} poster={video.thumbnailUrl} className="w-full h-full object-cover" controls />
          <button onClick={() => setVideo(null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-400/20 rounded-full text-xs text-amber-300">
              #{t}
              <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-amber-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-1 relative">
          {/* Image picker */}
          <div className="relative">
            <button onClick={() => { setShowImage(s => !s); setShowGif(false) }}
              className="p-2 rounded-xl text-white/30 hover:text-amber-300 hover:bg-white/5 transition-colors"
              title="新增圖片"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            {showImage && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <ImagePicker
                  onSelect={url => { addImage(url); setShowImage(false) }}
                  onClose={() => setShowImage(false)}
                  onUpload={uploadImage}
                />
              </div>
            )}
          </div>

          {/* GIF picker */}
          <div className="relative">
            <button onClick={() => { setShowGif(s => !s); setShowImage(false) }}
              className="px-2 py-1.5 rounded-xl text-white/30 hover:text-amber-300 hover:bg-white/5 transition-colors text-xs font-bold"
              title="GIF"
            >
              GIF
            </button>
            {showGif && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <GifPicker
                  onSelect={url => { addImage(url); setShowGif(false) }}
                  onClose={() => setShowGif(false)}
                />
              </div>
            )}
          </div>

          {/* Video upload — post type only */}
          {type === 'post' && (
            <>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleVideoSelect(e.target.files)} />
              <button
                onClick={() => videoRef.current?.click()}
                disabled={videoUploading || images.length > 0 || !!video}
                className="p-2 rounded-xl text-white/30 hover:text-amber-300 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="上傳影片（30 秒以內）"
              >
                {videoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
              </button>
            </>
          )}

          {/* Tag input */}
          <div className="flex items-center gap-1">
            <Tag className="w-4 h-4 text-white/20" />
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              placeholder="加標籤"
              className="w-20 text-xs text-white/50 bg-transparent outline-none placeholder-white/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {type === 'post' && (
            <span className={`text-xs ${content.length > 480 ? 'text-red-400' : 'text-white/20'}`}>
              {content.length}/500
            </span>
          )}
          {type === 'article' && (
            <span className="text-xs text-white/20">{blocks.length} 個區塊</span>
          )}
          <button
            onClick={submit}
            disabled={posting || (type === 'article' ? blocks.length === 0 : !content.trim())}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            發布
          </button>
        </div>
      </div>
    </div>
  )
}

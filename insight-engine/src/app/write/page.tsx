'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Loader2, Image as ImageIcon, Film, Tag, Globe, Lock,
  Plus, Trash2, GripVertical, Type, AlignLeft, X, CheckCircle
} from 'lucide-react'
import type { ArticleBlock } from '@/components/social/ArticleEditor'
import { blocksToHtml } from '@/components/social/ArticleEditor'
import { nanoid } from 'nanoid'

interface UserInfo {
  userId: string
  userName: string
  tenantId: string
}

// ── Simple inline block editor (no DnD overhead for the write page) ──
function BlockEditor({ blocks, onChange, onUpload }: {
  blocks: ArticleBlock[]
  onChange: (blocks: ArticleBlock[]) => void
  onUpload: (file: File) => Promise<string>
}) {
  const addText = () => onChange([...blocks, { id: nanoid(), type: 'text', textContent: '' }])
  const addImage = () => onChange([...blocks, { id: nanoid(), type: 'image', imageUrl: '' }])

  const updateBlock = (id: string, patch: Partial<ArticleBlock>) =>
    onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b))

  const deleteBlock = (id: string) => onChange(blocks.filter(b => b.id !== id))

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.id} className="group relative">
          <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => deleteBlock(block.id)} className="p-1 text-white/20 hover:text-rose-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {block.type === 'text' && (
            <textarea
              value={block.textContent ?? ''}
              onChange={e => updateBlock(block.id, { textContent: e.target.value })}
              placeholder="開始輸入段落..."
              className="w-full bg-transparent text-white/80 placeholder-white/20 outline-none resize-none text-base leading-relaxed min-h-[80px]"
              rows={4}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
            />
          )}

          {block.type === 'image' && (
            <ImageBlock
              block={block}
              onUpdate={patch => updateBlock(block.id, patch)}
              onUpload={onUpload}
            />
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-white/20">新增區塊：</span>
        <button onClick={addText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <Type className="w-3.5 h-3.5" /> 文字
        </button>
        <button onClick={addImage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" /> 圖片
        </button>
      </div>
    </div>
  )
}

function ImageBlock({ block, onUpdate, onUpload }: {
  block: ArticleBlock
  onUpdate: (patch: Partial<ArticleBlock>) => void
  onUpload: (file: File) => Promise<string>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (files: FileList | null) => {
    if (!files?.[0]) return
    setUploading(true)
    try {
      const url = await onUpload(files[0])
      onUpdate({ imageUrl: url })
    } finally {
      setUploading(false)
    }
  }

  if (block.imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <img src={block.imageUrl} alt={block.imageCaption ?? ''} className="w-full object-cover max-h-80 rounded-xl" />
        <div className="mt-2">
          <input
            value={block.imageCaption ?? ''}
            onChange={e => onUpdate({ imageCaption: e.target.value })}
            placeholder="圖片說明（可選）"
            className="w-full bg-transparent text-white/40 placeholder-white/20 outline-none text-xs text-center border-b border-white/10 focus:border-white/30 pb-1"
          />
        </div>
        <button onClick={() => onUpdate({ imageUrl: '' })}
          className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white/60 hover:text-white text-xs"
        >
          換圖
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 hover:border-white/25 rounded-xl cursor-pointer transition-colors"
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files)} />
      {uploading ? (
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      ) : (
        <>
          <ImageIcon className="w-6 h-6 text-white/20 mb-2" />
          <span className="text-xs text-white/25">點擊上傳圖片</span>
        </>
      )}
    </div>
  )
}

export default function WritePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: nanoid(), type: 'text', textContent: '' }
  ])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [coverImage, setCoverImage] = useState('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState('')
  const coverRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((data: UserInfo | null) => {
        if (data?.userId) setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/media', { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    if (!data.url) throw new Error(data.error ?? '上傳失敗')
    return data.url
  }

  const uploadCover = async (files: FileList | null) => {
    if (!files?.[0]) return
    setCoverUploading(true)
    try {
      const url = await uploadImage(files[0])
      setCoverImage(url)
    } catch {
      setError('封面上傳失敗')
    } finally {
      setCoverUploading(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('請填寫文章標題'); return }
    if (blocks.every(b => !b.textContent?.trim() && !b.imageUrl)) { setError('請新增至少一個段落或圖片'); return }

    setPosting(true)
    setError('')
    try {
      const content = blocksToHtml(blocks)
      const images = coverImage ? [{ url: coverImage, alt: title }] : []
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          title: title.trim(),
          content,
          images,
          tags,
          isPublic,
        }),
      })
      const data = await res.json() as { post?: { id: string }; error?: string }
      if (!res.ok || !data.post) throw new Error(data.error ?? '發布失敗')
      setPosted(true)
      setTimeout(() => router.push(`/articles/${data.post!.id}`), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '發布失敗')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">請先登入才能發文</p>
        <Link href="/login?redirect=/write" className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-400 transition-colors">
          前往登入
        </Link>
      </div>
    )
  }

  if (posted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <CheckCircle className="w-12 h-12 text-emerald-400" />
        <p className="text-white font-semibold text-lg">文章已發布！</p>
        <p className="text-white/40 text-sm">正在跳轉...</p>
      </div>
    )
  }

  const wordCount = blocks.reduce((acc, b) => acc + (b.textContent?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/articles" className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-sm font-semibold text-white/80">✍️ 雪境創作</span>
            <span className="text-xs text-white/25 ml-2">{wordCount} 字</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Public toggle */}
          <button onClick={() => setIsPublic(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isPublic
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-400'
                : 'border-white/10 bg-white/5 text-white/30'
            }`}
          >
            {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {isPublic ? '公開' : '私密'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={posting || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm rounded-xl transition-colors"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            發布
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="max-w-2xl mx-auto px-4 py-8 pl-12">

        {/* Cover image */}
        <div className="mb-6">
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden mb-4 group">
              <img src={coverImage} alt="封面" className="w-full object-cover max-h-56" />
              <button
                onClick={() => setCoverImage('')}
                className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-lg text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coverRef.current?.click()}
              disabled={coverUploading}
              className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors mb-4"
            >
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e.target.files)} />
              {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              新增封面圖片
            </button>
          )}
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="文章標題..."
          className="w-full bg-transparent text-white text-3xl font-bold placeholder-white/15 outline-none resize-none mb-2 leading-tight"
          rows={1}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />

        {/* Summary */}
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="文章摘要（可選）..."
          className="w-full bg-transparent text-white/40 text-sm placeholder-white/15 outline-none resize-none mb-6 leading-relaxed"
          rows={2}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />

        <div className="w-full h-px bg-white/8 mb-8" />

        {/* Block editor */}
        <BlockEditor
          blocks={blocks}
          onChange={setBlocks}
          onUpload={uploadImage}
        />

        <div className="w-full h-px bg-white/8 mt-8 mb-6" />

        {/* Tags */}
        <div className="space-y-3">
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> 標籤（最多 5 個）
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-400/20 rounded-full text-xs text-amber-300">
                  #{t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 5 && (
            <div className="flex items-center gap-2">
              <span className="text-white/20">#</span>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                placeholder="輸入標籤按 Enter"
                className="flex-1 bg-transparent text-white/60 placeholder-white/20 outline-none text-sm border-b border-white/10 focus:border-white/30 pb-1"
              />
              <button onClick={addTag}
                className="p-1 text-white/25 hover:text-amber-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-rose-500/10 border border-rose-400/20 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Bottom publish button */}
        <div className="mt-10 pb-16 flex items-center justify-end gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={posting || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm rounded-xl transition-colors"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            發布文章
          </button>
        </div>
      </div>
    </div>
  )
}

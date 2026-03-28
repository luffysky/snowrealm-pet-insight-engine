'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, ImageIcon, Loader2, X, Tag, Check } from 'lucide-react'

interface BlogArticle {
  id?: string
  title: string
  slug: string
  summary: string
  content: string
  coverImage: string
  tags: string[]
  isPublic: boolean
  seoTitle: string
  seoDesc: string
}

const EMPTY: BlogArticle = {
  title: '', slug: '', summary: '', content: '',
  coverImage: '', tags: [], isPublic: true, seoTitle: '', seoDesc: '',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, '') // remove CJK
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

interface Props {
  articleId?: string   // undefined = new article
  onSaved: (id: string, slug: string) => void
  onCancel: () => void
}

export function BlogEditor({ articleId, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<BlogArticle>(EMPTY)
  const [loading, setLoading] = useState(!!articleId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [tagInput, setTagInput] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'write' | 'seo'>('write')

  // Load existing article
  useEffect(() => {
    if (!articleId) return
    fetch(`/api/admin/social/blog/${articleId}`)
      .then(r => r.ok ? r.json() as Promise<{ article: {
        title: string; slug: string; summary: string | null; content: string
        cover_image: string | null; tags: string[]; is_public: boolean
        seo_title: string | null; seo_desc: string | null
      } }> : null)
      .then(d => {
        if (!d) return
        const a = d.article
        setForm({
          id: articleId,
          title: a.title, slug: a.slug, summary: a.summary ?? '',
          content: a.content, coverImage: a.cover_image ?? '',
          tags: a.tags ?? [], isPublic: a.is_public,
          seoTitle: a.seo_title ?? '', seoDesc: a.seo_desc ?? '',
        })
        if (editorRef.current) editorRef.current.innerHTML = a.content
      })
      .finally(() => setLoading(false))
  }, [articleId])

  // Auto-generate slug from title (only for new articles)
  const handleTitleChange = (title: string) => {
    const next = { ...form, title }
    if (!articleId && !form.slug) {
      const auto = slugify(title)
      if (auto) next.slug = auto
    }
    setForm(next)
  }

  // Debounced slug availability check
  const checkSlug = useCallback((slug: string) => {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    slugCheckTimer.current = setTimeout(async () => {
      const exclude = articleId ? `&exclude=${articleId}` : ''
      const res = await fetch(`/api/admin/social/blog/check-slug?slug=${slug}${exclude}`)
      if (res.ok) {
        const data = await res.json() as { available: boolean }
        setSlugStatus(data.available ? 'ok' : 'taken')
      }
    }, 500)
  }, [articleId])

  useEffect(() => { checkSlug(form.slug) }, [form.slug, checkSlug])

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/admin/social/messages/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        setForm(f => ({ ...f, coverImage: url }))
      }
    } finally { setUploadingCover(false) }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))

  const save = async () => {
    if (!form.title.trim()) { setError('請輸入標題'); return }
    if (!form.slug.trim()) { setError('請輸入 Slug'); return }
    if (slugStatus === 'taken') { setError('Slug 已被使用，請更換'); return }

    const content = editorRef.current?.innerHTML ?? ''
    setSaving(true); setError(null)
    try {
      const url = articleId ? `/api/admin/social/blog/${articleId}` : '/api/admin/social/blog'
      const method = articleId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          summary: form.summary || null,
          content,
          coverImage: form.coverImage || null,
          tags: form.tags,
          isPublic: form.isPublic,
          seoTitle: form.seoTitle || null,
          seoDesc: form.seoDesc || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setError(err.error ?? '儲存失敗')
        return
      }
      const data = await res.json() as { article: { id: string; slug: string } }
      onSaved(data.article.id, data.article.slug)
    } finally { setSaving(false) }
  }

  const execCmd = (cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  const insertImage = async (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/social/messages/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json() as { url: string }
      execCmd('insertImage', url)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )

  const slugStatusEl = () => {
    if (!form.slug) return null
    if (slugStatus === 'checking') return <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />
    if (slugStatus === 'ok') return <Check className="w-3.5 h-3.5 text-emerald-400" />
    if (slugStatus === 'taken') return <X className="w-3.5 h-3.5 text-rose-400" />
    return null
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-slate-900/80">
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/8">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white/80 flex-1">{articleId ? '編輯文章' : '撰寫新文章'}</h2>
        <button
          onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            form.isPublic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/8 text-white/40'
          }`}
        >
          {form.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {form.isPublic ? '公開' : '私人'}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          儲存
        </button>
      </div>

      {error && (
        <div className="shrink-0 px-4 py-2 bg-rose-500/15 border-b border-rose-500/20 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 px-4 pt-3 border-b border-white/6">
        {(['write', 'seo'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'text-amber-400 border-amber-400' : 'text-white/35 border-transparent hover:text-white/60'
            }`}
          >
            {tab === 'write' ? '✍️ 撰寫' : '🔍 SEO'}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'write' && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* Title */}
            <input
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="文章標題..."
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 outline-none border-b border-white/10 pb-3 focus:border-amber-400/40 transition-colors"
            />

            {/* Slug */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">文章 Slug</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-amber-400/30 transition-colors">
                <span className="text-xs text-white/25 shrink-0">/</span>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="my-article"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                />
                {slugStatusEl()}
              </div>
              {slugStatus === 'taken' && <p className="text-[10px] text-rose-400 mt-1">此 Slug 已被使用</p>}
            </div>

            {/* Cover Image */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">封面圖片</label>
              {form.coverImage ? (
                <div className="relative group">
                  <img src={form.coverImage} alt="" className="w-full h-40 object-cover rounded-2xl" />
                  <button
                    onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                    className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white/70" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 justify-center h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-colors">
                  {uploadingCover
                    ? <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                    : <><ImageIcon className="w-5 h-5 text-white/25" /><span className="text-sm text-white/25">上傳封面圖片</span></>
                  }
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
                  />
                </label>
              )}
            </div>

            {/* Summary */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">文章摘要</label>
              <textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="簡短描述這篇文章..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 resize-none transition-colors"
              />
            </div>

            {/* Editor */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">文章內容</label>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 mb-2 p-2 bg-white/4 rounded-xl border border-white/8">
                {[
                  { label: 'B', cmd: 'bold', style: 'font-bold' },
                  { label: 'I', cmd: 'italic', style: 'italic' },
                  { label: 'U', cmd: 'underline', style: 'underline' },
                ].map(t => (
                  <button key={t.cmd} onMouseDown={e => { e.preventDefault(); execCmd(t.cmd) }}
                    className={`w-7 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-xs text-white/60 hover:text-white transition-colors ${t.style}`}
                  >{t.label}</button>
                ))}
                <div className="w-px bg-white/10 mx-1" />
                {['H1', 'H2', 'H3'].map((h, i) => (
                  <button key={h} onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', `h${i + 1}`) }}
                    className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-[11px] text-white/60 hover:text-white transition-colors font-medium"
                  >{h}</button>
                ))}
                <button onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'p') }}
                  className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-[11px] text-white/60 hover:text-white transition-colors">¶</button>
                <div className="w-px bg-white/10 mx-1" />
                <button onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList') }}
                  className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-xs text-white/60 hover:text-white transition-colors">• 清單</button>
                <button onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList') }}
                  className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-xs text-white/60 hover:text-white transition-colors">1. 清單</button>
                <button onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'blockquote') }}
                  className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-xs text-white/60 hover:text-white transition-colors">&quot;</button>
                <div className="w-px bg-white/10 mx-1" />
                <label className="flex items-center">
                  <button onMouseDown={e => e.preventDefault()}
                    onClick={() => (document.getElementById('editor-img-upload') as HTMLInputElement)?.click()}
                    className="px-2 h-7 rounded-lg bg-white/5 hover:bg-white/12 text-xs text-white/60 hover:text-white transition-colors"
                  >🖼️ 圖片</button>
                  <input id="editor-img-upload" type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) insertImage(f) }}
                  />
                </label>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {}}
                className="min-h-[320px] w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400/20 transition-colors
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
                  [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                  [&_blockquote]:border-l-2 [&_blockquote]:border-amber-400/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:my-2
                  [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">標籤</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-300 text-xs rounded-full">
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-amber-300/50 hover:text-amber-300 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="輸入標籤後按 Enter"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <button onClick={addTag} className="px-3 py-2 bg-white/8 hover:bg-white/12 text-white/50 rounded-xl text-xs transition-colors">新增</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">SEO 標題</label>
              <input
                value={form.seoTitle}
                onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                placeholder={form.title || '自動使用文章標題'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">SEO 描述</label>
              <textarea
                value={form.seoDesc}
                onChange={e => setForm(f => ({ ...f, seoDesc: e.target.value }))}
                placeholder={form.summary || '自動使用文章摘要'}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 resize-none transition-colors"
              />
              <p className="text-[10px] text-white/25 mt-1">{form.seoDesc.length} / 160 字元</p>
            </div>
            <div className="p-4 bg-white/3 border border-white/8 rounded-2xl">
              <p className="text-[10px] text-white/30 font-medium mb-2 uppercase tracking-widest">搜尋結果預覽</p>
              <p className="text-base font-medium text-blue-400 truncate">{form.seoTitle || form.title || '文章標題'}</p>
              <p className="text-xs text-green-400/70 truncate mt-0.5">{typeof window !== 'undefined' ? window.location.origin : ''}/blogs/...</p>
              <p className="text-xs text-white/50 mt-1 line-clamp-2">{form.seoDesc || form.summary || '文章摘要描述'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

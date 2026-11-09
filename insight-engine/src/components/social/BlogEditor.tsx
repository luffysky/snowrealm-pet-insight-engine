'use client'

import { postUpload } from '@/lib/upload-client'
import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Eye, EyeOff, ImageIcon, Loader2, X, Tag, Check, Move, Sparkles, Globe, Bot, Send, ChevronDown, ChevronUp } from 'lucide-react'

const BlogTipTapEditor = dynamic(() => import('./BlogTipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] border border-white/10 rounded-xl flex items-center justify-center bg-white/3">
      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
    </div>
  ),
})

interface BlogArticle {
  id?: string
  title: string
  slug: string
  summary: string
  content: string
  coverImage: string
  coverImagePosition: string
  tags: string[]
  category: string
  isPublic: boolean
  seoTitle: string
  seoDesc: string
  seriesId: string
  seriesOrder: string
  /** 設定密碼（空字串 = 不設定 / 移除密碼） */
  password: string
  hasPassword: boolean
}

interface BlogSeries {
  id: string
  title: string
  description: string | null
  article_count: number
}

const BLOG_CATEGORIES = ['技術', '生活', '教學', '產品', '觀點', '其他'] as const

const EMPTY: BlogArticle = {
  title: '', slug: '', summary: '', content: '',
  coverImage: '', coverImagePosition: 'center center',
  tags: [], category: '', isPublic: true, seoTitle: '', seoDesc: '',
  seriesId: '', seriesOrder: '',
  password: '', hasPassword: false,
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

interface Props {
  articleId?: string
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
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'write' | 'seo' | 'series'>('write')
  const [adjustingPosition, setAdjustingPosition] = useState(false)
  const coverPreviewRef = useRef<HTMLDivElement>(null)

  // Series state
  const [seriesList, setSeriesList] = useState<BlogSeries[]>([])
  const [newSeriesTitle, setNewSeriesTitle] = useState('')
  const [creatingSeries, setCreatingSeries] = useState(false)

  // AI state
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSlugLoading, setAiSlugLoading] = useState(false)
  const [aiCoverLoading, setAiCoverLoading] = useState(false)
  const [aiCoverStyle, setAiCoverStyle] = useState<'illustration' | 'realistic' | 'abstract' | 'minimal'>('illustration')

  // AI writing assistant panel
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiMode, setAiMode] = useState<'full' | 'outline' | 'refine'>('full')
  const [aiTier, setAiTier] = useState<'sonnet' | 'haiku'>('sonnet')
  const [aiKeyPref, setAiKeyPref] = useState<'own' | 'platform'>('platform')
  const [aiKeyInfo, setAiKeyInfo] = useState<{
    hasOwnKey: boolean
    ownKeyProvider: string | null
    ownKeyModel: string | null
    isUnlimited: boolean
    loaded: boolean
  }>({ hasOwnKey: false, ownKeyProvider: null, ownKeyModel: null, isUnlimited: false, loaded: false })
  const [aiWriting, setAiWriting] = useState(false)
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'ai'; text: string; applied?: boolean }[]>([])
  const aiChatEndRef = useRef<HTMLDivElement>(null)

  const AI_COSTS = {
    sonnet: { full: 200, outline: 50, refine: 100 },
    haiku:  { full: 80,  outline: 20, refine: 40  },
  } as const

  // Load AI key info when panel opens
  useEffect(() => {
    if (!aiPanelOpen || aiKeyInfo.loaded) return
    fetch('/api/blogs/ai-write')
      .then(r => r.json())
      .then((data: { hasOwnKey: boolean; ownKeyProvider: string | null; ownKeyModel: string | null; isUnlimited: boolean }) => {
        setAiKeyInfo({ ...data, loaded: true })
        // Default: own key if available, else platform
        if (data.hasOwnKey && !data.isUnlimited) setAiKeyPref('own')
      })
      .catch(() => setAiKeyInfo(prev => ({ ...prev, loaded: true })))
  }, [aiPanelOpen, aiKeyInfo.loaded])

  // Check for Yukirin blog draft in localStorage (only for new articles)
  useEffect(() => {
    if (articleId) return
    try {
      const raw = localStorage.getItem('yukirin_blog_draft')
      if (!raw) return
      const draft = JSON.parse(raw) as {
        title: string; content: string; summary: string
        tags: string[]; seoTitle: string; seoDesc: string; suggestedSlug: string
        createdAt: number
      }
      // Only use if draft is less than 10 minutes old
      if (Date.now() - draft.createdAt > 10 * 60 * 1000) {
        localStorage.removeItem('yukirin_blog_draft')
        return
      }
      setForm(f => ({
        ...f,
        title: draft.title || f.title,
        content: draft.content || f.content,
        summary: draft.summary || f.summary,
        tags: draft.tags.length ? draft.tags : f.tags,
        seoTitle: draft.seoTitle || f.seoTitle,
        seoDesc: draft.seoDesc || f.seoDesc,
        slug: draft.suggestedSlug || f.slug,
      }))
      localStorage.removeItem('yukirin_blog_draft')
    } catch {
      // ignore
    }
  }, [articleId])

  // Load existing article
  useEffect(() => {
    if (!articleId) { setLoading(false); return }
    fetch(`/api/admin/social/blog/${articleId}`)
      .then(r => r.ok ? r.json() as Promise<{ article: {
        title: string; slug: string; summary: string | null; content: string
        cover_image: string | null; cover_image_position?: string; tags: string[]
        category?: string | null
        is_public: boolean; seo_title: string | null; seo_desc: string | null
        series_id: string | null; series_order: number | null; has_password?: boolean
      } }> : null)
      .then(d => {
        if (!d) return
        const a = d.article
        setForm({
          id: articleId,
          title: a.title, slug: a.slug, summary: a.summary ?? '',
          content: a.content, coverImage: a.cover_image ?? '',
          coverImagePosition: a.cover_image_position ?? 'center center',
          tags: a.tags ?? [], category: a.category ?? '', isPublic: a.is_public,
          seoTitle: a.seo_title ?? '', seoDesc: a.seo_desc ?? '',
          seriesId: a.series_id ?? '', seriesOrder: a.series_order?.toString() ?? '',
          password: '', hasPassword: !!a.has_password,
        })
      })
      .finally(() => setLoading(false))
  }, [articleId])

  // Load series list
  useEffect(() => {
    fetch('/api/admin/social/blog/series')
      .then(r => r.ok ? r.json() as Promise<{ series: BlogSeries[] }> : null)
      .then(d => { if (d) setSeriesList(d.series) })
      .catch(() => {})
  }, [])

  const handleTitleChange = (title: string) => {
    const next = { ...form, title }
    if (!articleId && !form.slug) {
      const auto = slugify(title)
      if (auto) next.slug = auto
    }
    setForm(next)
  }

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
      const res = await postUpload('/api/admin/social/messages/upload', fd)
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        setForm(f => ({ ...f, coverImage: url }))
      }
    } finally { setUploadingCover(false) }
  }

  const handleAiCoverGenerate = async () => {
    if (!form.title.trim()) {
      setError('請先填寫文章標題，才能生成封面圖片')
      return
    }
    setAiCoverLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/social/blog/ai-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          tags: form.tags,
          style: aiCoverStyle,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'AI 封面生成失敗')
        return
      }
      const { imageUrl } = await res.json() as { imageUrl: string }
      setForm(f => ({ ...f, coverImage: imageUrl }))
    } catch {
      setError('AI 封面生成失敗，請稍後再試')
    } finally {
      setAiCoverLoading(false)
    }
  }

  const addTag = () => {
    // Support comma-separated bulk tag input
    const parts = tagInput.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 0) {
      setForm(f => ({
        ...f,
        tags: [...f.tags, ...parts.filter(p => !f.tags.includes(p))],
      }))
    }
    setTagInput('')
  }

  // AI: write full article
  const handleAiWrite = async () => {
    if (!aiPrompt.trim()) return
    const userMsg = aiPrompt.trim()
    const usingOwnKey = aiKeyPref === 'own' && aiKeyInfo.hasOwnKey
    const cost = usingOwnKey || aiKeyInfo.isUnlimited ? 0 : AI_COSTS[aiTier][aiMode]
    setAiHistory(h => [...h, { role: 'user', text: userMsg }])
    setAiPrompt('')
    setAiWriting(true)
    try {
      const res = await fetch('/api/blogs/ai-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          existingTitle: form.title || undefined,
          existingContent: form.content || undefined,
          mode: aiMode,
          tier: aiTier,
          keyPreference: aiKeyPref,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setAiHistory(h => [...h, { role: 'ai', text: `❌ ${err.error ?? '生成失敗'}` }])
        return
      }
      const data = await res.json() as {
        title: string; content: string; summary: string
        tags: string[]; seoTitle: string; seoDesc: string; suggestedSlug: string
        newBalance?: number | null; cost?: number
      }
      // Apply to form
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        content: data.content || f.content,
        summary: data.summary || f.summary,
        tags: data.tags.length ? [...new Set([...f.tags, ...data.tags])] : f.tags,
        seoTitle: data.seoTitle || f.seoTitle,
        seoDesc: data.seoDesc || f.seoDesc,
        slug: (!f.id && !f.slug && data.suggestedSlug) ? data.suggestedSlug : f.slug,
      }))
      const actualCost = data.cost ?? cost
      const balanceHint = data.newBalance != null ? `（剩餘 ${data.newBalance} Z幣）` : ''
      const costLine = actualCost === 0 ? '免費生成' : `扣除 ${actualCost} Z幣${balanceHint}`
      const preview = `✅ 已填入所有欄位！${costLine}\n\n標題：${data.title}\n標籤：${data.tags.join('、')}\n摘要：${data.summary.slice(0, 60)}...`
      setAiHistory(h => [...h, { role: 'ai', text: preview, applied: true }])
    } catch {
      setAiHistory(h => [...h, { role: 'ai', text: '❌ 網路錯誤，請重試' }])
    } finally {
      setAiWriting(false)
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))

  const save = async () => {
    if (!form.title.trim()) { setError('請輸入標題'); return }
    if (!form.slug.trim()) { setError('請輸入 Slug'); return }
    if (slugStatus === 'taken') { setError('Slug 已被使用，請更換'); return }

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
          content: form.content,
          coverImage: form.coverImage || null,
          coverImagePosition: form.coverImagePosition || 'center center',
          tags: form.tags,
          category: form.category || null,
          isPublic: form.isPublic,
          seoTitle: form.seoTitle || null,
          seoDesc: form.seoDesc || null,
          seriesId: form.seriesId || null,
          seriesOrder: form.seriesOrder ? parseInt(form.seriesOrder) : null,
          // 有輸入新密碼才送；hasPassword=false 且 password='' = 移除密碼；不送 = 不修改
          ...(form.password
            ? { password: form.password }
            : !form.hasPassword && articleId
              ? { password: null }
              : {}),
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

  // AI: generate summary + seoTitle + seoDesc
  const handleAiSummary = async () => {
    if (!form.title.trim()) { setError('請先輸入標題'); return }
    setAiSummaryLoading(true)
    try {
      const res = await fetch('/api/admin/social/blog/ai-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, content: form.content, mode: 'summary' }),
      })
      if (res.ok) {
        const data = await res.json() as { summary?: string; seoTitle?: string; seoDesc?: string }
        setForm(f => ({
          ...f,
          summary: data.summary || f.summary,
          seoTitle: data.seoTitle || f.seoTitle,
          seoDesc: data.seoDesc || f.seoDesc,
        }))
      } else {
        const err = await res.json() as { error?: string }
        setError(err.error ?? 'AI 生成失敗')
      }
    } finally { setAiSummaryLoading(false) }
  }

  // AI: translate title to English slug
  const handleAiSlug = async () => {
    if (!form.title.trim()) { setError('請先輸入標題'); return }
    setAiSlugLoading(true)
    try {
      const res = await fetch('/api/admin/social/blog/ai-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, mode: 'slug' }),
      })
      if (res.ok) {
        const data = await res.json() as { slug?: string }
        if (data.slug) {
          setForm(f => ({ ...f, slug: data.slug! }))
        }
      } else {
        const err = await res.json() as { error?: string }
        setError(err.error ?? 'AI 翻譯失敗')
      }
    } finally { setAiSlugLoading(false) }
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
    <div className="flex flex-col min-h-0 h-full bg-slate-900/90 backdrop-blur-sm">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-slate-900/80">
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/8">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white/80 flex-1">{articleId ? '編輯文章' : '撰寫新文章'}</h2>
        {/* Yukirin AI writing assistant trigger */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('yukirin:open-blog-write'))
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-400/20 transition-colors"
          title="開啟雪凜 AI 協助創作"
        >
          <Bot className="w-3.5 h-3.5" />
          雪凜協作
        </button>
        {/* AI Writing Assistant toggle */}
        <button
          onClick={() => setAiPanelOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            aiPanelOpen
              ? 'bg-amber-500/25 border border-amber-400/30 text-amber-300'
              : 'bg-white/8 hover:bg-white/12 text-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI 助手
        </button>
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

      {/* AI Writing Assistant Panel */}
      {aiPanelOpen && (
        <div className="shrink-0 border-b border-violet-500/20 bg-violet-950/20">
          {/* Mode selector + chat history */}
          <div className="px-4 pt-3 pb-2">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span className="text-xs font-medium text-violet-300">AI 寫作助手</span>
              {/* Cost hint */}
              <span className="text-[10px] text-white/30 ml-1">
                {aiKeyInfo.isUnlimited
                  ? '— 🌟 平台禮遇免費'
                  : aiKeyPref === 'own' && aiKeyInfo.hasOwnKey
                    ? '— 使用自己的 Key（免費）'
                    : `— ${AI_COSTS[aiTier][aiMode]} Z幣`
                }
              </span>
              {/* Mode selector */}
              <div className="ml-auto flex gap-1">
                {(['full', 'outline', 'refine'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setAiMode(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      aiMode === m ? 'bg-violet-500/30 text-violet-300' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {m === 'full' ? '完整文章' : m === 'outline' ? '大綱' : '潤稿'}
                  </button>
                ))}
              </div>
            </div>

            {/* Key source / tier selection (only for non-unlimited users) */}
            {!aiKeyInfo.isUnlimited && aiKeyInfo.loaded && (
              <div className="mb-2">
                {aiKeyInfo.hasOwnKey ? (
                  /* User has own key → show toggle */
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 shrink-0">✨ 檢測到您有自己的 AI Key</span>
                    <span className="text-[10px] text-white/30">
                      {aiKeyInfo.ownKeyProvider} {aiKeyInfo.ownKeyModel ? `· ${aiKeyInfo.ownKeyModel}` : ''}
                    </span>
                    <div className="ml-auto flex gap-0.5 border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setAiKeyPref('own')}
                        className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          aiKeyPref === 'own' ? 'bg-emerald-500/30 text-emerald-300' : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        自己的（免費）
                      </button>
                      <button
                        onClick={() => setAiKeyPref('platform')}
                        className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          aiKeyPref === 'platform' ? 'bg-violet-500/30 text-violet-300' : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        平台 Sonnet
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No own key → show tier selector for platform key */
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">模型：</span>
                    <div className="flex gap-0.5 border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setAiTier('sonnet')}
                        className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          aiTier === 'sonnet' ? 'bg-violet-500/40 text-violet-200' : 'text-white/30 hover:text-white/60'
                        }`}
                        title="Sonnet — 品質更高"
                      >
                        ⚡Sonnet
                      </button>
                      <button
                        onClick={() => setAiTier('haiku')}
                        className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          aiTier === 'haiku' ? 'bg-slate-500/40 text-slate-300' : 'text-white/30 hover:text-white/60'
                        }`}
                        title="Haiku — Z幣較少"
                      >
                        Haiku
                      </button>
                    </div>
                    <span className="text-[10px] text-white/25">
                      {AI_COSTS[aiTier][aiMode]} Z幣
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Chat history (max 3 items, scrollable) */}
            {aiHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto mb-2 space-y-1.5">
                {aiHistory.slice(-6).map((msg, i) => (
                  <div key={i} className={`text-xs rounded-lg px-3 py-1.5 ${
                    msg.role === 'user'
                      ? 'bg-white/[0.06] text-white/60 text-right ml-8'
                      : msg.applied
                        ? 'bg-violet-500/15 text-violet-200 mr-8'
                        : 'bg-red-500/10 text-red-300 mr-8'
                  }`}>
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split('\n').length - 1 ? <br /> : null}</span>
                    ))}
                  </div>
                ))}
                <div ref={aiChatEndRef} />
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !aiWriting) { e.preventDefault(); handleAiWrite() } }}
                placeholder={
                  aiMode === 'full' ? '描述你想寫的文章，例如：分享我第一次去日本旅行的深刻體驗...'
                  : aiMode === 'outline' ? '描述文章主題，AI 先給你大綱框架...'
                  : '告訴 AI 如何改善，例如：讓開頭更吸引人，加入更多例子...'
                }
                disabled={aiWriting}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/40 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleAiWrite}
                disabled={aiWriting || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
              >
                {aiWriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {aiWriting ? '生成中...' : '生成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="shrink-0 px-4 py-2 bg-rose-500/15 border-b border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 px-4 pt-3 border-b border-white/8 bg-slate-900/80">
        {(['write', 'series', 'seo'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'text-amber-400 border-amber-400' : 'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            {tab === 'write' ? '✍️ 撰寫' : tab === 'series' ? '📚 系列' : '🔍 SEO'}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest">文章 Slug</label>
                <button
                  type="button"
                  onClick={handleAiSlug}
                  disabled={aiSlugLoading || !form.title.trim()}
                  className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 rounded-lg text-[11px] transition-colors disabled:opacity-40"
                >
                  {aiSlugLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                  AI 翻譯
                </button>
              </div>
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
                <div className="space-y-2">
                  <div
                    ref={coverPreviewRef}
                    className={`relative overflow-hidden rounded-2xl h-40 ${adjustingPosition ? 'cursor-crosshair ring-2 ring-amber-400/60' : 'group'}`}
                    onClick={e => {
                      if (!adjustingPosition) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                      setForm(f => ({ ...f, coverImagePosition: `${x}% ${y}%` }))
                    }}
                  >
                    <img
                      src={form.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: form.coverImagePosition }}
                      draggable={false}
                    />
                    {adjustingPosition && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <p className="text-xs text-white bg-black/50 px-3 py-1.5 rounded-full">點擊設定焦點位置</p>
                      </div>
                    )}
                    {!adjustingPosition && (
                      <button
                        onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                        className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-white/70" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustingPosition(p => !p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        adjustingPosition
                          ? 'bg-amber-500/30 border border-amber-400/40 text-amber-300'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
                      }`}
                    >
                      <Move className="w-3 h-3" />
                      {adjustingPosition ? '完成調整' : '調整焦點'}
                    </button>
                    {form.coverImagePosition !== 'center center' && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, coverImagePosition: 'center center' }))}
                        className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        ↺ 重設
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={aiCoverLoading || !form.title.trim()}
                      onClick={handleAiCoverGenerate}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aiCoverLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Sparkles className="w-3 h-3" />
                      }
                      {aiCoverLoading ? '生成中' : 'AI 重新生成'}
                    </button>
                    <span className="text-[11px] text-white/25 ml-auto">{form.coverImagePosition}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 justify-center h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/20 transition-colors">
                    {uploadingCover
                      ? <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                      : <><ImageIcon className="w-5 h-5 text-white/25" /><span className="text-sm text-white/25">上傳封面圖片</span></>
                    }
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={aiCoverLoading || !form.title.trim()}
                      onClick={handleAiCoverGenerate}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aiCoverLoading
                        ? <><Loader2 className="w-3 h-3 animate-spin" />AI 生成中...</>
                        : <><Sparkles className="w-3 h-3" />AI 生成封面</>
                      }
                    </button>
                    <select
                      value={aiCoverStyle}
                      onChange={e => setAiCoverStyle(e.target.value as typeof aiCoverStyle)}
                      className="text-[11px] bg-white/5 border border-white/10 text-white/50 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="illustration">插畫風格</option>
                      <option value="realistic">寫實風格</option>
                      <option value="abstract">抽象風格</option>
                      <option value="minimal">極簡風格</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest">文章摘要</label>
                <button
                  type="button"
                  onClick={handleAiSummary}
                  disabled={aiSummaryLoading || !form.title.trim()}
                  className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[11px] transition-colors disabled:opacity-40"
                >
                  {aiSummaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI 生成摘要
                </button>
              </div>
              <textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="簡短描述這篇文章..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 resize-none transition-colors"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">文章內容</label>
              <BlogTipTapEditor
                content={form.content}
                onChange={html => setForm(f => ({ ...f, content: html }))}
                articleId={articleId}
                uploadEndpoint="/api/admin/social/messages/upload"
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
                  placeholder="輸入標籤後按 Enter（可用逗號分隔一次加多個）"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <button onClick={addTag} className="px-3 py-2 bg-white/8 hover:bg-white/12 text-white/50 rounded-xl text-xs transition-colors">新增</button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">分類</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30 transition-colors appearance-none"
              >
                <option value="">（未分類）</option>
                {BLOG_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'series' && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* Current series assignment */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-2">所屬系列</label>
              <select
                value={form.seriesId}
                onChange={e => setForm(f => ({ ...f, seriesId: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30 transition-colors appearance-none"
              >
                <option value="">（不屬於任何系列）</option>
                {seriesList.map(s => (
                  <option key={s.id} value={s.id}>{s.title}（共 {s.article_count} 篇）</option>
                ))}
              </select>
            </div>

            {form.seriesId && (
              <div>
                <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-2">系列排序（第幾篇）</label>
                <input
                  type="number"
                  min="1"
                  value={form.seriesOrder}
                  onChange={e => setForm(f => ({ ...f, seriesOrder: e.target.value }))}
                  placeholder="例：1（空白則自動排到最後）"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <p className="text-[10px] text-white/25 mt-1">數字越小排越前面，留空則排在系列最後</p>
              </div>
            )}

            {/* Create new series */}
            <div className="pt-2 border-t border-white/8">
              <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest mb-3">建立新系列</p>
              <div className="flex gap-2">
                <input
                  value={newSeriesTitle}
                  onChange={e => setNewSeriesTitle(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!newSeriesTitle.trim() || creatingSeries) return
                      setCreatingSeries(true)
                      try {
                        const res = await fetch('/api/admin/social/blog/series', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title: newSeriesTitle.trim() }),
                        })
                        if (res.ok) {
                          const data = await res.json() as { series: BlogSeries & { article_count?: number } }
                          const newSeries = { ...data.series, article_count: 0 }
                          setSeriesList(prev => [newSeries, ...prev])
                          setForm(f => ({ ...f, seriesId: newSeries.id }))
                          setNewSeriesTitle('')
                        }
                      } finally { setCreatingSeries(false) }
                    }
                  }}
                  placeholder="輸入系列名稱後按 Enter"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <button
                  disabled={!newSeriesTitle.trim() || creatingSeries}
                  onClick={async () => {
                    if (!newSeriesTitle.trim() || creatingSeries) return
                    setCreatingSeries(true)
                    try {
                      const res = await fetch('/api/admin/social/blog/series', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: newSeriesTitle.trim() }),
                      })
                      if (res.ok) {
                        const data = await res.json() as { series: BlogSeries & { article_count?: number } }
                        const newSeries = { ...data.series, article_count: 0 }
                        setSeriesList(prev => [newSeries, ...prev])
                        setForm(f => ({ ...f, seriesId: newSeries.id }))
                        setNewSeriesTitle('')
                      }
                    } finally { setCreatingSeries(false) }
                  }}
                  className="px-3 py-2 bg-white/8 hover:bg-white/12 text-white/50 rounded-xl text-xs transition-colors disabled:opacity-40"
                >
                  {creatingSeries ? '建立中...' : '新增'}
                </button>
              </div>
            </div>

            {/* Series list */}
            {seriesList.length > 0 && (
              <div className="pt-2 border-t border-white/8 space-y-2">
                <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest">我的系列</p>
                {seriesList.map(s => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      form.seriesId === s.id
                        ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                        : 'bg-white/[0.03] border-white/8 text-white/60 hover:bg-white/[0.06]'
                    }`}
                    onClick={() => setForm(f => ({ ...f, seriesId: f.seriesId === s.id ? '' : s.id }))}
                  >
                    <span className="text-base">📚</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-[10px] text-white/30">{s.article_count} 篇文章</p>
                    </div>
                    {form.seriesId === s.id && <span className="text-xs text-amber-400">✓ 已選</span>}
                  </div>
                ))}
              </div>
            )}
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
            {/* 密碼保護 */}
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">文章密碼保護</label>
              <div className="space-y-2">
                {form.hasPassword && (
                  <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                    <span>🔒</span> 目前已設定密碼
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, password: '', hasPassword: false }))}
                      className="ml-auto text-rose-400/70 hover:text-rose-400 text-[10px]"
                    >
                      移除密碼
                    </button>
                  </p>
                )}
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={form.hasPassword ? '輸入新密碼以更換（留空則保留現有密碼）' : '設定閱讀密碼（留空代表不加密）'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <p className="text-[10px] text-white/25">設定後讀者需輸入密碼才能查看文章內容</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-widest block mb-1.5">一鍵 AI 生成 SEO</label>
              <button
                type="button"
                onClick={handleAiSummary}
                disabled={aiSummaryLoading || !form.title.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/20 text-amber-300 rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                {aiSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI 生成摘要 + SEO 標題 + SEO 描述
              </button>
              <p className="text-[10px] text-white/25 mt-1.5">根據文章標題和內容自動生成，可在上方欄位手動調整</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Globe, Check, X, ExternalLink } from 'lucide-react'
import { BlogEditor } from '@/components/social/BlogEditor'

interface Article {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  is_public: boolean
  view_count: number
  published_at: string
  tags: string[]
}

interface BlogSettings {
  blog_slug: string | null
  blog_title: string | null
  blog_desc: string | null
  is_enabled: boolean
}

export default function BlogManagePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [settings, setSettings] = useState<BlogSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null | 'new'>(null)
  const [tab, setTab] = useState<'articles' | 'settings'>('articles')

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({ blogSlug: '', blogTitle: '', blogDesc: '', isEnabled: true })
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/social/blog').then(r => r.ok ? r.json() as Promise<{ articles: Article[] }> : null),
      fetch('/api/admin/social/blog/settings').then(r => r.ok ? r.json() as Promise<{ settings: BlogSettings | null }> : null),
      fetch('/api/auth/me').then(r => r.ok ? r.json() as Promise<{ userId: string }> : null),
    ]).then(([artData, setData, meData]) => {
      if (artData) setArticles(artData.articles)
      if (setData?.settings) {
        setSettings(setData.settings)
        setSettingsForm({
          blogSlug: setData.settings.blog_slug ?? '',
          blogTitle: setData.settings.blog_title ?? '',
          blogDesc: setData.settings.blog_desc ?? '',
          isEnabled: setData.settings.is_enabled,
        })
      }
      if (meData?.userId) setMyUserId(meData.userId)
    }).finally(() => setLoading(false))
  }, [])

  // Blog slug availability check
  useEffect(() => {
    const slug = settingsForm.blogSlug.trim()
    if (!slug) { setSlugCheckStatus('idle'); return }
    if (slug === settings?.blog_slug) { setSlugCheckStatus('ok'); return }
    if (!/^[a-z0-9-]{3,30}$/.test(slug)) { setSlugCheckStatus('idle'); return }
    setSlugCheckStatus('checking')
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/admin/social/blog/check-slug?slug=${slug}`)
      if (res.ok) {
        const data = await res.json() as { available: boolean }
        setSlugCheckStatus(data.available ? 'ok' : 'taken')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [settingsForm.blogSlug, settings?.blog_slug])

  const saveSettings = async () => {
    if (slugCheckStatus === 'taken') { setSettingsError('Blog Slug 已被使用'); return }
    setSettingsSaving(true); setSettingsError(null)
    const res = await fetch('/api/admin/social/blog/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogSlug: settingsForm.blogSlug || null,
        blogTitle: settingsForm.blogTitle || null,
        blogDesc: settingsForm.blogDesc || null,
        isEnabled: settingsForm.isEnabled,
      }),
    })
    if (res.ok) {
      const data = await res.json() as { settings: BlogSettings }
      setSettings(data.settings)
    } else {
      const e = await res.json() as { error?: string }
      setSettingsError(e.error ?? '儲存失敗')
    }
    setSettingsSaving(false)
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('確定要刪除這篇文章？')) return
    await fetch(`/api/admin/social/blog/${id}`, { method: 'DELETE' })
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const togglePublic = async (article: Article) => {
    const res = await fetch(`/api/admin/social/blog/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !article.is_public }),
    })
    if (res.ok) {
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_public: !a.is_public } : a))
    }
  }

  const handleSaved = (id: string) => {
    setEditingId(null)
    // Reload articles list
    fetch('/api/admin/social/blog')
      .then(r => r.ok ? r.json() as Promise<{ articles: Article[] }> : null)
      .then(d => { if (d) setArticles(d.articles) })
  }

  const blogPublicSlug = settings?.blog_slug ?? myUserId ?? ''

  if (editingId !== null) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-transparent">
        <BlogEditor
          articleId={editingId === 'new' ? undefined : editingId}
          onSaved={handleSaved}
          onCancel={() => setEditingId(null)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-[#3d3155] p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">📝 我的部落格</h1>
          {blogPublicSlug && (
            <a
              href={`/blogs/${blogPublicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-700 hover:text-amber-400 flex items-center gap-1 mt-0.5 transition-colors"
            >
              <Globe className="w-3 h-3" />
              /blogs/{blogPublicSlug}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setEditingId('new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> 新增文章
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/8">
        {(['articles', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'text-amber-400 border-amber-400' : 'text-[#6b5fa8] border-transparent hover:text-[#8a7ca8]'
            }`}
          >
            {t === 'articles' ? `文章列表 (${articles.length})` : '部落格設定'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#8a7ca8] animate-spin" /></div>
      ) : tab === 'articles' ? (
        articles.length === 0 ? (
          <div className="text-center py-20 text-[#6b5fa8]">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-sm font-medium mb-1">還沒有文章</p>
            <p className="text-xs text-[#6b5fa8] mb-6">點擊「新增文章」開始寫你的第一篇部落格</p>
            <button
              onClick={() => setEditingId('new')}
              className="px-6 py-2.5 bg-amber-500/20 text-amber-300 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors"
            >
              ✍️ 開始寫文章
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <div key={article.id} className="flex gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/8 rounded-[20px] transition-all group">
                {article.cover_image && (
                  <img src={article.cover_image} alt="" className="w-20 h-14 object-cover rounded-xl shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#3d3155]/90 flex-1 truncate">{article.title}</h3>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      article.is_public ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-[#8a7ca8]'
                    }`}>
                      {article.is_public ? '公開' : '私人'}
                    </span>
                  </div>
                  {article.summary && <p className="text-xs text-[#6b5fa8] truncate mt-0.5">{article.summary}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6b5fa8]">
                    <span>/{article.slug}</span>
                    <span>👁 {article.view_count}</span>
                    <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePublic(article)}
                    title={article.is_public ? '設為私人' : '設為公開'}
                    className="p-1.5 rounded-lg hover:bg-white/8 text-[#8a7ca8] hover:text-[#3d3155] transition-colors"
                  >
                    {article.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/blogs/${blogPublicSlug}/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/8 text-[#8a7ca8] hover:text-[#3d3155] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setEditingId(article.id)}
                    className="p-1.5 rounded-lg hover:bg-white/8 text-[#8a7ca8] hover:text-[#3d3155] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[#6b5fa8] hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Settings tab */
        <div className="max-w-xl space-y-5">
          {settingsError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/20 rounded-xl text-xs text-rose-300">{settingsError}</div>
          )}

          <div>
            <label className="text-[11px] text-[#6b5fa8] font-medium uppercase tracking-widest block mb-1.5">部落格 Slug（個人 URL）</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-amber-400/30 transition-colors">
              <span className="text-xs text-[#6b5fa8] shrink-0">/blogs/</span>
              <input
                value={settingsForm.blogSlug}
                onChange={e => setSettingsForm(f => ({ ...f, blogSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder={myUserId ?? 'your-slug'}
                className="flex-1 bg-transparent text-sm text-[#3d3155] placeholder-[#b5a8d0] outline-none"
              />
              {slugCheckStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b5fa8] shrink-0" />}
              {slugCheckStatus === 'ok' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {slugCheckStatus === 'taken' && <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            </div>
            <p className="text-[10px] text-[#6b5fa8] mt-1">3-30 字元，只能含小寫英文、數字和連字號。未設定時使用你的用戶 ID。</p>
          </div>

          <div>
            <label className="text-[11px] text-[#6b5fa8] font-medium uppercase tracking-widest block mb-1.5">部落格標題</label>
            <input
              value={settingsForm.blogTitle}
              onChange={e => setSettingsForm(f => ({ ...f, blogTitle: e.target.value }))}
              placeholder="我的部落格"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#3d3155] placeholder-[#b5a8d0] outline-none focus:border-amber-400/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#6b5fa8] font-medium uppercase tracking-widest block mb-1.5">部落格簡介</label>
            <textarea
              value={settingsForm.blogDesc}
              onChange={e => setSettingsForm(f => ({ ...f, blogDesc: e.target.value }))}
              placeholder="分享我的想法與故事..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#3d3155] placeholder-[#b5a8d0] outline-none focus:border-amber-400/30 resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-[20px]">
            <div>
              <p className="text-sm font-medium text-[#3d3155]">啟用部落格</p>
              <p className="text-xs text-[#8a7ca8] mt-0.5">關閉後他人無法瀏覽你的部落格</p>
            </div>
            <button
              onClick={() => setSettingsForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.isEnabled ? 'bg-amber-500' : 'bg-[#b8a9e8]/15'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settingsForm.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button
            onClick={saveSettings}
            disabled={settingsSaving || slugCheckStatus === 'taken'}
            className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            儲存設定
          </button>
        </div>
      )}
    </div>
  )
}

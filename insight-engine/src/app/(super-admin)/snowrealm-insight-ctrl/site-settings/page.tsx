'use client'

import { useState, useEffect, useRef } from 'react'

interface SiteSettings {
  site_title: string
  site_description: string
  og_title: string
  og_description: string
  og_image_url: string
  og_site_name: string
  og_locale: string
  twitter_card: string
  favicon_url: string
}

const CARD = 'bg-slate-900/60 border border-slate-800'

export default function SuperAdminSiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: '', site_description: '', og_title: '', og_description: '',
    og_image_url: '', og_site_name: '', og_locale: 'zh_TW', twitter_card: 'summary_large_image',
    favicon_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const ogInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/super-admin/site-settings')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setSettings({
            site_title: data.site_title ?? '',
            site_description: data.site_description ?? '',
            og_title: data.og_title ?? '',
            og_description: data.og_description ?? '',
            og_image_url: data.og_image_url ?? '',
            og_site_name: data.og_site_name ?? '',
            og_locale: data.og_locale ?? 'zh_TW',
            twitter_card: data.twitter_card ?? 'summary_large_image',
            favicon_url: data.favicon_url ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/super-admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setMsg(res.ok ? '✅ 儲存成功' : '❌ 儲存失敗')
    } catch {
      setMsg('❌ 網路錯誤')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'og' | 'favicon') {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', target === 'og' ? 'og' : 'favicon')
      const res = await fetch('/api/super-admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data.url) {
        const key = target === 'og' ? 'og_image_url' : 'favicon_url'
        setSettings(prev => ({ ...prev, [key]: data.url }))
        setMsg('上傳成功')
      } else {
        setMsg(data.error || '上傳失敗')
      }
    } catch { setMsg('上傳失敗') }
    finally { setUploading(false) }
  }

  function update(key: keyof SiteSettings, v: string) {
    setSettings(prev => ({ ...prev, [key]: v }))
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入設定中...</p>

  const inputCls = 'w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">🌐 首頁 Meta / OG / SEO</h1>
        <p className="text-sm text-white/40 mt-1">設定平台首頁的標題、描述和社群分享預覽。儲存後下次頁面載入即生效。</p>
      </div>

      {/* 基本 Meta */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white/90">📝 基本 Meta 標籤</h2>
        <div>
          <label className="block text-sm text-white/50 mb-1">網站標題 (title)</label>
          <input type="text" value={settings.site_title} onChange={e => update('site_title', e.target.value)} placeholder="SnowRealm Insight Engine — 問卷系統" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">網站描述 (description)</label>
          <textarea value={settings.site_description} onChange={e => update('site_description', e.target.value)} placeholder="改善你的網站在搜尋引擎中的呈現..." rows={3} className={inputCls} />
        </div>
      </section>

      {/* Open Graph */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white/90">🔗 Open Graph（社群分享）</h2>
        <div>
          <label className="block text-sm text-white/50 mb-1">OG 標題（留空使用網站標題）</label>
          <input type="text" value={settings.og_title} onChange={e => update('og_title', e.target.value)} placeholder="分享時的標題" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">OG 描述（留空使用網站描述）</label>
          <textarea value={settings.og_description} onChange={e => update('og_description', e.target.value)} placeholder="分享時的描述" rows={2} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/50 mb-1">OG 網站名稱</label>
            <input type="text" value={settings.og_site_name} onChange={e => update('og_site_name', e.target.value)} placeholder="SnowRealm Insight Engine" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-1">Locale</label>
            <input type="text" value={settings.og_locale} onChange={e => update('og_locale', e.target.value)} placeholder="zh_TW" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Twitter Card</label>
          <select value={settings.twitter_card} onChange={e => update('twitter_card', e.target.value)} className={inputCls}>
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </select>
        </div>

        {/* OG 圖片上傳 */}
        <div>
          <label className="block text-sm text-white/50 mb-2">OG 預覽圖片（建議 1200×630）</label>
          {settings.og_image_url && (
            <div className="mb-3 rounded-lg overflow-hidden border border-slate-700 max-w-md">
              <img src={settings.og_image_url} alt="OG Preview" className="w-full h-auto" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <input ref={ogInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleUpload(e, 'og')} className="hidden" />
            <button onClick={() => ogInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white rounded-lg text-sm transition-colors cursor-pointer">
              {uploading ? '上傳中...' : '上傳 OG 圖片'}
            </button>
            {settings.og_image_url && (
              <button onClick={() => update('og_image_url', '')} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors cursor-pointer">移除</button>
            )}
          </div>
          <input type="text" value={settings.og_image_url} onChange={e => update('og_image_url', e.target.value)} placeholder="或直接貼上圖片 URL" className={`mt-2 ${inputCls} text-xs text-white/50`} />
        </div>
      </section>

      {/* Favicon */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white/90">🎯 Favicon</h2>
        <div className="flex items-center gap-4">
          {settings.favicon_url && <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 rounded" />}
          <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={e => handleUpload(e, 'favicon')} className="hidden" />
          <button onClick={() => faviconInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer">
            上傳 Favicon
          </button>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Favicon URL</label>
          <input type="text" value={settings.favicon_url} onChange={e => update('favicon_url', e.target.value)} placeholder="或直接貼上 URL" className={inputCls} />
        </div>
      </section>

      {/* 預覽卡片 */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white/90">👁️ 社群分享預覽</h2>
        <div className="bg-white rounded-lg overflow-hidden max-w-md border">
          {settings.og_image_url ? (
            <img src={settings.og_image_url} alt="OG" className="w-full h-[180px] object-cover" />
          ) : (
            <div className="w-full h-[180px] bg-slate-200 flex items-center justify-center text-slate-400 text-sm">
              尚未設定 OG 圖片
            </div>
          )}
          <div className="p-3">
            <p className="text-xs text-gray-500 uppercase">{settings.og_site_name || 'website'}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1 line-clamp-1">
              {settings.og_title || settings.site_title || '網站標題'}
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {settings.og_description || settings.site_description || '網站描述'}
            </p>
          </div>
        </div>
      </section>

      {/* 分享測試 */}
      <section className={`${CARD} rounded-xl p-6 space-y-3`}>
        <h2 className="text-lg font-semibold text-white/90">🔗 分享測試</h2>
        <p className="text-sm text-white/40">儲存後點下方按鈕，確認分享預覽是否正確。</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={typeof window !== 'undefined' ? `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#06C755] hover:opacity-80 text-white text-sm font-medium rounded-lg transition-opacity cursor-pointer"
          >
            💬 分享到 LINE
          </a>
          <a
            href={typeof window !== 'undefined' ? `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(window.location.origin)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            🔍 FB 除錯工具
          </a>
          <a
            href={typeof window !== 'undefined' ? `https://www.opengraph.xyz/url/${encodeURIComponent(window.location.origin)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            👁️ OG 預覽檢查
          </a>
        </div>
      </section>

      {/* 儲存 */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-medium rounded-lg transition-colors cursor-pointer">
          {saving ? '儲存中...' : '💾 儲存設定'}
        </button>
        {msg && <span className={`text-sm ${msg.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
      </div>
    </div>
  )
}

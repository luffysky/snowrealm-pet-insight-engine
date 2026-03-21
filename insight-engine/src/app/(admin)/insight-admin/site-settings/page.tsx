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

const CARD = 'bg-slate-800/50 border border-slate-700/50'

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: '', site_description: '', og_title: '', og_description: '',
    og_image_url: '', og_site_name: '', og_locale: 'zh_TW', twitter_card: 'summary_large_image',
    favicon_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then(r => r.json())
      .then(data => {
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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) setMsg('儲存成功')
      else setMsg('儲存失敗')
    } catch {
      setMsg('網路錯誤')
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

      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (res.ok && data.url) {
        if (target === 'og') {
          setSettings(prev => ({ ...prev, og_image_url: data.url }))
        } else {
          setSettings(prev => ({ ...prev, favicon_url: data.url }))
        }
        setMsg('上傳成功')
      } else {
        setMsg(data.error || '上傳失敗')
      }
    } catch {
      setMsg('上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  function update(key: keyof SiteSettings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="p-8 text-slate-400">載入中...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">網站 Meta / OG 設定</h1>
      <p className="text-sm text-slate-400">設定網站標題、描述和社群分享時的預覽圖片。修改後會即時反映到公開頁面。</p>

      {/* 基本 Meta */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white">基本 Meta 標籤</h2>
        <Field label="網站標題 (title)" value={settings.site_title} onChange={v => update('site_title', v)} placeholder="我的問卷系統" />
        <Field label="網站描述 (description)" value={settings.site_description} onChange={v => update('site_description', v)} placeholder="描述你的服務..." textarea />
      </section>

      {/* Open Graph */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white">Open Graph (社群分享)</h2>
        <Field label="OG 標題" value={settings.og_title} onChange={v => update('og_title', v)} placeholder="留空則使用網站標題" />
        <Field label="OG 描述" value={settings.og_description} onChange={v => update('og_description', v)} placeholder="留空則使用網站描述" textarea />
        <Field label="OG 網站名稱" value={settings.og_site_name} onChange={v => update('og_site_name', v)} placeholder="SnowRealm Insight Engine" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Locale" value={settings.og_locale} onChange={v => update('og_locale', v)} placeholder="zh_TW" />
          <div>
            <label className="block text-sm text-slate-400 mb-1">Twitter Card</label>
            <select
              value={settings.twitter_card}
              onChange={e => update('twitter_card', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>
        </div>

        {/* OG Image Upload */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">OG 預覽圖片 (建議 1200x630)</label>
          {settings.og_image_url && (
            <div className="mb-3 rounded-lg overflow-hidden border border-slate-700 max-w-md">
              <img src={settings.og_image_url} alt="OG Preview" className="w-full h-auto" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={e => handleUpload(e, 'og')}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-cyan-800 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              {uploading ? '上傳中...' : '上傳 OG 圖片'}
            </button>
            {settings.og_image_url && (
              <button
                onClick={() => update('og_image_url', '')}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors cursor-pointer"
              >
                移除
              </button>
            )}
          </div>
          {settings.og_image_url && (
            <input
              type="text"
              value={settings.og_image_url}
              onChange={e => update('og_image_url', e.target.value)}
              className="mt-2 w-full bg-slate-900 border border-slate-700 text-slate-400 rounded-lg px-3 py-1.5 text-xs"
              placeholder="或直接貼上圖片 URL"
            />
          )}
          {!settings.og_image_url && (
            <input
              type="text"
              value=""
              onChange={e => update('og_image_url', e.target.value)}
              className="mt-2 w-full bg-slate-900 border border-slate-700 text-slate-400 rounded-lg px-3 py-1.5 text-xs"
              placeholder="或直接貼上圖片 URL"
            />
          )}
        </div>
      </section>

      {/* Favicon */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white">Favicon</h2>
        <div className="flex items-center gap-4">
          {settings.favicon_url && (
            <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 rounded" />
          )}
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/png,image/x-icon,image/svg+xml"
            onChange={e => handleUpload(e, 'favicon')}
            className="hidden"
          />
          <button
            onClick={() => faviconInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            上傳 Favicon
          </button>
        </div>
        <Field label="Favicon URL" value={settings.favicon_url} onChange={v => update('favicon_url', v)} placeholder="或直接貼上 URL" />
      </section>

      {/* OG Preview Card */}
      <section className={`${CARD} rounded-xl p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-white">社群分享預覽</h2>
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

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-t-btn hover:bg-t-btn-hover disabled:bg-cyan-800 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
        {msg && (
          <span className={`text-sm ${msg.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean
}) {
  const cls = 'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-t-accent/50 focus:border-t-accent placeholder:text-slate-600'
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  )
}

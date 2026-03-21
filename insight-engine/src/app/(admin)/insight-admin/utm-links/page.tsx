'use client'

import { useEffect, useState, useCallback } from 'react'

interface UtmLink {
  id: string
  name: string
  base_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  full_url: string
  click_count: number
  created_at: string
}

const COMMON_SOURCES = ['line', 'instagram', 'facebook', 'google', 'email', 'qrcode']
const COMMON_MEDIUMS = ['chat', 'social', 'cpc', 'email', 'referral', 'organic']

export default function UtmLinksPage() {
  const [links, setLinks] = useState<UtmLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    base_url: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  })

  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/utm-links')
    if (res.ok) setLinks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  // 即時預覽
  const previewUrl = (() => {
    try {
      const url = new URL(form.base_url || 'https://example.com')
      if (form.utm_source) url.searchParams.set('utm_source', form.utm_source)
      if (form.utm_medium) url.searchParams.set('utm_medium', form.utm_medium)
      if (form.utm_campaign) url.searchParams.set('utm_campaign', form.utm_campaign)
      return url.toString()
    } catch {
      return ''
    }
  })()

  function handleCreate() {
    if (!form.name || !form.base_url) return
    setConfirmAction({
      title: '建立 UTM 連結',
      message: `確認建立「${form.name}」？`,
      onConfirm: async () => {
        const res = await fetch('/api/admin/utm-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          setShowForm(false)
          setForm({ name: '', base_url: '', utm_source: '', utm_medium: '', utm_campaign: '' })
          fetchLinks()
        }
        setConfirmAction(null)
      },
    })
  }

  function handleDelete(link: UtmLink) {
    setConfirmAction({
      title: '刪除追蹤連結',
      message: `確認刪除「${link.name}」？此操作無法復原。`,
      onConfirm: async () => {
        await fetch(`/api/admin/utm-links?id=${link.id}`, { method: 'DELETE' })
        fetchLinks()
        setConfirmAction(null)
      },
    })
  }

  async function copyToClipboard(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">UTM 連結管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-t-btn text-white rounded hover:bg-t-btn-hover text-sm"
        >
          {showForm ? '取消' : '+ 建立連結'}
        </button>
      </div>

      {/* 建立表單 */}
      {showForm && (
        <div className="bg-slate-800/80 rounded-lg p-4 space-y-3 border border-slate-700">
          <h3 className="text-white font-medium">建立追蹤連結</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="連結名稱（如「LINE 推播 - 3月活動」）"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm md:col-span-2"
            />
            <input
              placeholder="基礎 URL（如 https://insight.snowrealm.pet/survey）"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm md:col-span-2"
            />
            <div>
              <label className="block text-xs text-slate-400 mb-1">utm_source</label>
              <div className="flex gap-2">
                <input
                  placeholder="例：line"
                  value={form.utm_source}
                  onChange={(e) => setForm({ ...form, utm_source: e.target.value })}
                  className="flex-1 bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                />
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setForm({ ...form, utm_source: e.target.value }) }}
                  className="bg-slate-900 text-slate-400 px-2 py-2 rounded border border-slate-600 text-xs"
                >
                  <option value="">快選</option>
                  {COMMON_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">utm_medium</label>
              <div className="flex gap-2">
                <input
                  placeholder="例：chat"
                  value={form.utm_medium}
                  onChange={(e) => setForm({ ...form, utm_medium: e.target.value })}
                  className="flex-1 bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                />
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setForm({ ...form, utm_medium: e.target.value }) }}
                  className="bg-slate-900 text-slate-400 px-2 py-2 rounded border border-slate-600 text-xs"
                >
                  <option value="">快選</option>
                  {COMMON_MEDIUMS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">utm_campaign</label>
              <input
                placeholder="例：march-survey-2026"
                value={form.utm_campaign}
                onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
              />
            </div>
          </div>

          {/* 即時預覽 */}
          {form.base_url && (
            <div className="bg-slate-900 rounded p-3">
              <p className="text-xs text-slate-400 mb-1">預覽連結</p>
              <p className="text-t-accent text-sm break-all">{previewUrl}</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!form.name || !form.base_url}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            確認建立
          </button>
        </div>
      )}

      {/* 連結列表 */}
      {loading ? (
        <p className="text-slate-400">載入中…</p>
      ) : links.length === 0 ? (
        <p className="text-slate-400">尚無追蹤連結，按「建立連結」開始</p>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium mb-1">{link.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                    {link.utm_source && (
                      <span className="bg-t-accent-bg text-t-accent px-2 py-0.5 rounded">source: {link.utm_source}</span>
                    )}
                    {link.utm_medium && (
                      <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">medium: {link.utm_medium}</span>
                    )}
                    {link.utm_campaign && (
                      <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded">campaign: {link.utm_campaign}</span>
                    )}
                  </div>
                  <p className="text-t-accent text-xs break-all mb-1">{link.full_url}</p>
                  <p className="text-slate-500 text-xs">
                    建立於 {new Date(link.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => copyToClipboard(link.full_url, link.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      copied === link.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {copied === link.id ? '已複製!' : '複製'}
                  </button>
                  <button
                    onClick={() => handleDelete(link)}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 二次確認 Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">{confirmAction.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">取消</button>
              <button onClick={confirmAction.onConfirm} className="px-4 py-2 bg-t-btn text-white rounded text-sm hover:bg-t-btn-hover">確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

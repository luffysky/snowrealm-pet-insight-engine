'use client'

import { useEffect, useState } from 'react'

interface WebhookConfig {
  id: string
  event_type: string
  url: string
  active: boolean
  created_at: string
}

const EVENT_TYPES = [
  { value: 'survey.submitted', label: '問卷送出' },
  { value: 'waitlist.joined', label: '加入封測名單' },
]

export default function WebhooksPage() {
  const [configs, setConfigs] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [lineTesting, setLineTesting] = useState(false)
  const [lineResult, setLineResult] = useState('')
  const [newEventType, setNewEventType] = useState('survey.submitted')
  const [newUrl, setNewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch('/api/admin/webhooks')
      .then((r) => r.json())
      .then(setConfigs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAdd = async () => {
    setError('')
    if (!newUrl.startsWith('https://')) {
      setError('URL 必須以 https:// 開頭')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: newEventType, url: newUrl }),
    })
    if (res.ok) {
      setNewUrl('')
      load()
    } else {
      const data = await res.json()
      setError(data.error ?? '新增失敗')
    }
    setSaving(false)
  }

  const handleToggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此 webhook？')) return
    await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <p className="text-[#8a7ca8]">載入中…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🔔 Webhook 通知</h1>
        <p className="text-[#8a7ca8] mt-1">
          問卷送出或加入封測名單時，自動推播到 LINE 及自訂 Webhook URL
        </p>
      </div>

      {/* LINE Messaging API */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-[#b8a9e8]/25 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]">📱 LINE 推播通知</h2>
        <p className="text-[#8a7ca8] text-sm">
          問卷送出、加入封測名單時，自動推播訊息到管理員 LINE。已透過 Messaging API 串接。
        </p>

        {/* Webhook URL 設定 */}
        <div className="space-y-3">
          <p className="text-xs text-[#3d3155]0 font-medium">
            LINE Developers Console → Messaging API → Webhook settings
          </p>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-[#3d3155]0 mb-1">官方帳號 @474iwlht（用戶互動）</p>
            <code className="text-sm text-green-300 break-all select-all">
              {process.env.NEXT_PUBLIC_BASE_URL}/api/line/webhook/official
            </code>
            <p className="text-xs text-amber-200/90 mt-2">
              Rich Menu 的「封測／最新消息／聯絡我們」是文字訊息，必須指向此網址；若誤設成 <code className="text-amber-100">/api/line/webhook</code>（足跡帳號）會驗簽失敗，聊天室不會出現自動回覆。
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-[#3d3155]0 mb-1">INSIGHT @762wxvfb（管理員通知）</p>
            <code className="text-sm text-green-300 break-all select-all">
              {process.env.NEXT_PUBLIC_BASE_URL}/api/line/webhook
            </code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setLineTesting(true)
              setLineResult('')
              try {
                const res = await fetch('/api/admin/line/test', { method: 'POST' })
                setLineResult(res.ok ? '✅ 測試訊息已發送，請檢查 LINE' : '❌ 發送失敗')
              } catch {
                setLineResult('❌ 發送失敗')
              }
              setLineTesting(false)
            }}
            disabled={lineTesting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {lineTesting ? '發送中…' : '🔔 發送測試訊息'}
          </button>
          {lineResult && <span className="text-sm text-slate-300">{lineResult}</span>}
        </div>
      </div>

      {/* 新增表單 */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-[#b8a9e8]/25 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]">新增 Webhook</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-[#8a7ca8] mb-1">事件類型</label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
              className="bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-0 w-full sm:min-w-[300px]">
            <label className="block text-sm text-[#8a7ca8] mb-1">Webhook URL（HTTPS only）</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newUrl}
            className="bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? '新增中…' : '+ 新增'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* 列表 */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-[#b8a9e8]/25 p-6">
        <h2 className="text-lg font-semibold text-[#3d3155] mb-4">已設定的 Webhooks</h2>
        {configs.length === 0 ? (
          <p className="text-[#8a7ca8]">尚未設定任何 webhook</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-[#b8a9e8]/20 text-[#8a7ca8]">
                <th className="text-left py-2 px-3">事件</th>
                <th className="text-left py-2 px-3">URL</th>
                <th className="text-center py-2 px-3">狀態</th>
                <th className="text-right py-2 px-3">操作</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {configs.map((c) => (
                <tr key={c.id} className="border-b border-[#b8a9e8]/20">
                  <td className="py-2 px-3">
                    <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded">
                      {EVENT_TYPES.find((t) => t.value === c.event_type)?.label ?? c.event_type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs max-w-xs truncate">{c.url}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleToggle(c.id, c.active)}
                      className={`text-xs px-2 py-0.5 rounded cursor-pointer ${
                        c.active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-[#b8a9e8]/15/20 text-[#3d3155]0'
                      }`}
                    >
                      {c.active ? '啟用中' : '已停用'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

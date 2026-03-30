'use client'

import { useState, useEffect } from 'react'

interface PlatformNotification {
  id: string
  title: string
  content: string
  category: string
  target: string
  channels: string[]
  status: string
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number
  read_count: number
  created_at: string
}

const CATEGORY_ICONS: Record<string, string> = {
  announcement: '📢',
  maintenance: '🔧',
  feature: '✨',
  promotion: '🎉',
  urgent: '🚨',
}

const CATEGORY_LABELS: Record<string, string> = {
  announcement: '公告',
  maintenance: '維護',
  feature: '新功能',
  promotion: '促銷',
  urgent: '緊急',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  scheduled: '排程中',
  sent: '已發送',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-slate-400',
  scheduled: 'text-amber-400',
  sent: 'text-green-400',
  cancelled: 'text-red-400',
}

interface CreateForm {
  title: string
  content: string
  category: string
  target: string
  channels: string[]
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>({
    title: '',
    content: '',
    category: 'announcement',
    target: 'all',
    channels: ['line', 'dashboard'],
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/notifications')
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/super-admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'draft' }),
      })
      if (res.ok) {
        setMsg('已建立草稿')
        setShowCreate(false)
        setForm({ title: '', content: '', category: 'announcement', target: 'all', channels: ['line', 'dashboard'] })
        loadNotifications()
      } else {
        setMsg('建立失敗')
      }
    } catch {
      setMsg('網路錯誤')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定刪除草稿？')) return
    await fetch(`/api/super-admin/notifications/${id}`, { method: 'DELETE' })
    loadNotifications()
  }

  async function handleSend(id: string) {
    if (!confirm('確定立即發送？此操作無法撤回。')) return
    setMsg('發送中...')
    try {
      const res = await fetch(`/api/super-admin/notifications/${id}/send`, { method: 'POST' })
      const data = await res.json() as { ok?: boolean; sentCount?: number; warnings?: string[]; error?: string }
      if (data.ok) {
        setMsg(`✅ 已發送給 ${data.sentCount ?? 0} 位用戶${data.warnings?.length ? `（警告：${data.warnings[0]}）` : ''}`)
      } else {
        setMsg(`❌ ${data.error ?? '發送失敗'}`)
      }
    } catch {
      setMsg('❌ 網路錯誤')
    }
    loadNotifications()
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/super-admin/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadNotifications()
  }

  const filtered = notifications.filter(n => filter === 'all' || n.category === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📢 平台通知管理</h1>
          <p className="text-sm text-slate-400 mt-1">向所有租戶或特定群體發送系統通知</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          + 建立通知
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">建立新通知</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">標題</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              placeholder="通知標題"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">內容</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              placeholder="通知內容（支援 markdown）"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">類型</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">推送目標</label>
              <select
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">全部租戶</option>
                <option value="pro">僅 Pro</option>
                <option value="free">僅 Free</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {saving ? '儲存中...' : '存為草稿'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              取消
            </button>
            {msg && (
              <span className={`text-sm ${msg.includes('失敗') || msg.includes('錯誤') ? 'text-red-400' : 'text-green-400'}`}>
                {msg}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([['all', '全部']] as [string, string][]).concat(Object.entries(CATEGORY_LABELS)).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === k ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {k !== 'all' ? `${CATEGORY_ICONS[k] ?? ''} ` : ''}{v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">載入中...</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-slate-500 text-sm py-8 text-center">尚無通知紀錄</div>
          )}
          {filtered.map(n => (
            <div key={n.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{CATEGORY_ICONS[n.category] ?? '📢'}</span>
                    <span className="text-white font-medium text-sm truncate">{n.title}</span>
                    <span className={`text-xs font-medium shrink-0 ${STATUS_COLORS[n.status] ?? 'text-slate-400'}`}>
                      · {STATUS_LABELS[n.status] ?? n.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{n.content}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>目標：{n.target === 'all' ? '全部' : n.target}</span>
                    <span>管道：{n.channels?.join(' + ')}</span>
                    {n.status === 'sent' && (
                      <span>送達 {n.sent_count} · 已讀 {n.read_count}</span>
                    )}
                    <span>{new Date(n.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleSend(n.id)}
                        className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded text-xs transition-colors cursor-pointer"
                      >
                        立即發送
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors cursor-pointer"
                      >
                        刪除
                      </button>
                    </>
                  )}
                  {n.status === 'sent' && (
                    <span className="text-green-400 text-xs">已發送</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

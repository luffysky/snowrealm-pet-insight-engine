'use client'

import { useState, useEffect } from 'react'

interface NotificationStyle {
  event_type: string
  display_name: string
  is_active: boolean
  header_color: string
  header_text: string | null
  body_template: string
  footer_text: string | null
  button_label: string | null
  button_url: string | null
  text_template: string
  updated_at: string
}

export default function NotificationStylesPage() {
  const [styles, setStyles] = useState<NotificationStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<NotificationStyle | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadStyles()
  }, [])

  async function loadStyles() {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/notification-styles')
      const data = await res.json()
      setStyles(Array.isArray(data) ? data : [])
    } catch {
      setStyles([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/super-admin/notification-styles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (res.ok) {
        setMsg('已儲存')
        loadStyles()
        setTimeout(() => setMsg(''), 2000)
      } else {
        setMsg('儲存失敗')
      }
    } catch {
      setMsg('網路錯誤')
    } finally {
      setSaving(false)
    }
  }

  function updateEditing(key: keyof NotificationStyle, value: string | boolean) {
    setEditing(prev => (prev ? { ...prev, [key]: value } : null))
  }

  if (loading) return <div className="text-slate-400">載入中...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🎨 通知樣式管理</h1>
        <p className="text-sm text-slate-400 mt-1">管理系統事件觸發的 LINE 訊息樣式與文案模板</p>
      </div>

      <div className="grid gap-3">
        {styles.length === 0 && (
          <div className="text-slate-500 text-sm py-8 text-center">
            尚未設定任何通知樣式（需先執行 seed migration）
          </div>
        )}
        {styles.map(s => (
          <div
            key={s.event_type}
            className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer transition-colors ${
              editing?.event_type === s.event_type
                ? 'border-amber-500/50'
                : 'border-slate-700 hover:border-slate-600'
            }`}
            onClick={() => setEditing(editing?.event_type === s.event_type ? null : { ...s })}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-medium text-sm">{s.display_name}</span>
                <span className="text-slate-500 text-xs ml-2">({s.event_type})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${s.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                  {s.is_active ? '● 啟用' : '○ 停用'}
                </span>
                <span
                  className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                  style={{ backgroundColor: s.header_color }}
                />
              </div>
            </div>
            {s.text_template && (
              <p className="text-slate-400 text-xs mt-1 line-clamp-1">{s.text_template}</p>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">編輯：{editing.display_name}</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={e => updateEditing('is_active', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-400">啟用</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">標題列顏色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.header_color}
                  onChange={e => updateEditing('header_color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-600"
                />
                <input
                  type="text"
                  value={editing.header_color}
                  onChange={e => updateEditing('header_color', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">標題文字</label>
              <input
                value={editing.header_text ?? ''}
                onChange={e => updateEditing('header_text', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="留空使用預設"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              純文字模板（支援 {'{{variable}}'}）
            </label>
            <textarea
              value={editing.text_template}
              onChange={e => updateEditing('text_template', e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Flex Message Body 模板（JSON 或文字）
            </label>
            <textarea
              value={editing.body_template}
              onChange={e => updateEditing('body_template', e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">按鈕文字</label>
              <input
                value={editing.button_label ?? ''}
                onChange={e => updateEditing('button_label', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">按鈕連結</label>
              <input
                value={editing.button_url ?? ''}
                onChange={e => updateEditing('button_url', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button
              onClick={() => setEditing(null)}
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
    </div>
  )
}

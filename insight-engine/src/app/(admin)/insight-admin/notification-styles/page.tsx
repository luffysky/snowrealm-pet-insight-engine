'use client'

import { useEffect, useState, useCallback } from 'react'

interface NotificationStyle {
  id: string
  label: string
  header_color: string
  header_emoji: string
  header_text: string
  footer_label: string
  footer_url: string
  footer_color: string
  is_active: boolean
  updated_at: string
}

export default function NotificationStylesPage() {
  const [styles, setStyles] = useState<NotificationStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<NotificationStyle>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchStyles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notification-styles')
      if (res.ok) setStyles(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStyles() }, [fetchStyles])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function startEdit(style: NotificationStyle) {
    setEditingId(style.id)
    setEditForm({
      header_color: style.header_color,
      header_emoji: style.header_emoji,
      header_text: style.header_text,
      footer_label: style.footer_label,
      footer_url: style.footer_url,
      footer_color: style.footer_color,
      is_active: style.is_active,
    })
  }

  async function handleSave(id: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/notification-styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (res.ok) {
        setEditingId(null)
        setToast('已儲存')
        fetchStyles()
      } else {
        const data = await res.json().catch(() => ({}))
        setToast(`儲存失敗：${data.error ?? res.statusText}`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(style: NotificationStyle) {
    await fetch('/api/admin/notification-styles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: style.id, is_active: !style.is_active }),
    })
    setToast(style.is_active ? '已停用' : '已啟用')
    fetchStyles()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">LINE 通知樣式</h1>
        <p className="text-sm text-[#8a7ca8]">管理各類 LINE Flex Message 的顏色、文字與按鈕</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 text-[#3d3155] px-4 py-2 rounded-lg shadow-lg border border-[#b8a9e8]/30 text-sm animate-pulse">
          {toast}
        </div>
      )}

      {loading ? (
        <p className="text-[#8a7ca8] animate-pulse">載入中…</p>
      ) : styles.length === 0 ? (
        <p className="text-[#8a7ca8]">尚無通知樣式設定</p>
      ) : (
        <div className="grid gap-4">
          {styles.map((style) => {
            const isEditing = editingId === style.id
            return (
              <div
                key={style.id}
                className={`bg-white/60 backdrop-blur-sm rounded-xl border transition-all ${
                  style.is_active ? 'border-[#b8a9e8]/20' : 'border-[#b8a9e8]/20/40 opacity-60'
                }`}
              >
                {/* Header with preview color band */}
                <div
                  className="h-2 rounded-t-xl"
                  style={{ backgroundColor: style.header_color }}
                />

                <div className="p-4 space-y-3">
                  {/* Title row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{style.header_emoji}</span>
                      <div>
                        <h3 className="text-[#3d3155] font-medium">{style.label}</h3>
                        <p className="text-xs text-[#3d3155]/60 font-mono">{style.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(style)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          style.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-[#b8a9e8]/10 text-[#8a7ca8] hover:bg-[#b8a9e8]/15'
                        }`}
                      >
                        {style.is_active ? '啟用中' : '已停用'}
                      </button>
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(style)}
                          className="px-3 py-1 rounded text-xs bg-[#b8a9e8]/20 text-t-accent hover:bg-[#b8a9e8]/20 transition-colors cursor-pointer"
                        >
                          編輯
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSave(style.id)}
                            disabled={saving}
                            className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded text-xs bg-[#b8a9e8]/10 text-slate-300 hover:bg-[#b8a9e8]/15 transition-colors cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Display or Edit mode */}
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-[#b8a9e8]/20">
                      <Field label="Header 顏色">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editForm.header_color ?? ''}
                            onChange={e => setEditForm({ ...editForm, header_color: e.target.value })}
                            className="w-8 h-8 rounded border border-[#b8a9e8]/30 cursor-pointer bg-transparent"
                          />
                          <input
                            value={editForm.header_color ?? ''}
                            onChange={e => setEditForm({ ...editForm, header_color: e.target.value })}
                            className="flex-1 bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm font-mono"
                            placeholder="#0e7990"
                          />
                        </div>
                      </Field>
                      <Field label="Header Emoji">
                        <input
                          value={editForm.header_emoji ?? ''}
                          onChange={e => setEditForm({ ...editForm, header_emoji: e.target.value })}
                          className="w-full bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm"
                          placeholder="📋"
                        />
                      </Field>
                      <Field label="Header 標題">
                        <input
                          value={editForm.header_text ?? ''}
                          onChange={e => setEditForm({ ...editForm, header_text: e.target.value })}
                          className="w-full bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm"
                          placeholder="新問卷回覆"
                        />
                      </Field>
                      <Field label="Button 文字">
                        <input
                          value={editForm.footer_label ?? ''}
                          onChange={e => setEditForm({ ...editForm, footer_label: e.target.value })}
                          className="w-full bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm"
                          placeholder="查看詳情"
                        />
                      </Field>
                      <Field label="Button 連結">
                        <input
                          value={editForm.footer_url ?? ''}
                          onChange={e => setEditForm({ ...editForm, footer_url: e.target.value })}
                          className="w-full bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm"
                          placeholder="/insight-admin/responses"
                        />
                      </Field>
                      <Field label="Button 顏色">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editForm.footer_color ?? ''}
                            onChange={e => setEditForm({ ...editForm, footer_color: e.target.value })}
                            className="w-8 h-8 rounded border border-[#b8a9e8]/30 cursor-pointer bg-transparent"
                          />
                          <input
                            value={editForm.footer_color ?? ''}
                            onChange={e => setEditForm({ ...editForm, footer_color: e.target.value })}
                            className="flex-1 bg-white/60 text-[#3d3155] px-3 py-1.5 rounded border border-[#b8a9e8]/30 text-sm font-mono"
                            placeholder="#0e7990"
                          />
                        </div>
                      </Field>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-[#b8a9e8]/20 text-xs">
                      <InfoCell label="Header" value={style.header_text} />
                      <InfoCell label="顏色" value={style.header_color} color={style.header_color} />
                      <InfoCell label="Emoji" value={style.header_emoji} />
                      <InfoCell label="Button" value={style.footer_label || '—'} />
                      <InfoCell label="連結" value={style.footer_url || '—'} />
                      <InfoCell label="Button 色" value={style.footer_color || '—'} color={style.footer_color} />
                    </div>
                  )}

                  {/* Flex Preview */}
                  {!isEditing && (
                    <FlexPreview style={style} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[#8a7ca8] mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[#3d3155]/60">{label}</p>
      <div className="flex items-center gap-1.5">
        {color && (
          <span
            className="inline-block w-3 h-3 rounded-sm border border-[#b8a9e8]/30 shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-slate-300 truncate">{value}</span>
      </div>
    </div>
  )
}

function FlexPreview({ style }: { style: NotificationStyle }) {
  return (
    <div className="mt-2">
      <p className="text-xs text-[#3d3155]/60 mb-1">預覽</p>
      <div className="max-w-xs rounded-lg overflow-hidden border border-[#b8a9e8]/20 shadow-lg">
        {/* Header */}
        <div
          className="px-3 py-2"
          style={{ backgroundColor: style.header_color }}
        >
          <p className="text-[#3d3155] font-bold text-sm">
            {style.header_emoji} {style.header_text}
          </p>
        </div>
        {/* Body mock */}
        <div className="bg-white px-3 py-2 space-y-1">
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-12 shrink-0">範例</span>
            <span className="text-gray-700">這是通知內容預覽</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-12 shrink-0">時間</span>
            <span className="text-gray-700">{new Date().toLocaleString('zh-TW')}</span>
          </div>
        </div>
        {/* Footer */}
        {style.footer_label && (
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
            <span
              className="text-xs font-medium"
              style={{ color: style.footer_color || style.header_color }}
            >
              {style.footer_label} →
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

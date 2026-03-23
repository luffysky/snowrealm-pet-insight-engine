'use client'

import { useEffect, useState, useCallback } from 'react'

interface RichMenu {
  richMenuId: string
  name: string
  chatBarText: string
  selected: boolean
  size: { width: number; height: number }
  areas: { bounds: Record<string, number>; action: Record<string, string> }[]
}

const TEMPLATES = [
  { id: 'official', label: '官方帳號', desc: '填問卷、封測、IG、官網、消息、聯絡', channel: 'official' as const },
  { id: 'admin', label: '後台管理', desc: '數據總覽、填答、標籤、問卷、漏斗、填寫', channel: 'insight' as const },
]

export default function RichMenuPage() {
  const [menus, setMenus] = useState<RichMenu[]>([])
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rich-menu')
      if (res.ok) {
        const data = await res.json()
        setMenus(data.menus ?? [])
        setDefaultId(data.defaultId ?? null)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMenus() }, [fetchMenus])

  async function doAction(action: string, richMenuId?: string) {
    setActionLoading(true)
    await fetch('/api/admin/rich-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, richMenuId }),
    })
    await fetchMenus()
    setActionLoading(false)
    setConfirmAction(null)
  }

  async function handleCreateFromTemplate(templateId: string, channel: 'official' | 'insight') {
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/admin/rich-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', template: templateId, channel }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateMsg({ ok: true, text: `建立成功！已設為預設選單 (${data.richMenuId})` })
        fetchMenus()
      } else {
        setCreateMsg({ ok: false, text: data.error || '建立失敗' })
      }
    } catch {
      setCreateMsg({ ok: false, text: '網路錯誤' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Rich Menu 管理</h1>

      {/* 從模板建立 */}
      <section className="bg-t-card-bg border border-t-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white/90">從模板建立</h2>
        <p className="text-sm text-slate-400">
          選擇模板一鍵建立 Rich Menu，自動產生圖片並設為預設。URL 根據環境變數自動填入。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">{t.label}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                  {t.channel === 'official' ? 'Official Bot' : 'Insight Bot'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{t.desc}</p>
              <button
                onClick={() => handleCreateFromTemplate(t.id, t.channel)}
                disabled={creating}
                className="w-full px-3 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {creating ? '建立中...' : '建立並設為預設'}
              </button>
            </div>
          ))}
        </div>
        {createMsg && (
          <p className={`text-sm ${createMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{createMsg.text}</p>
        )}
      </section>

      {/* 現有選單列表 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90">現有選單</h2>
          {defaultId && (
            <button
              onClick={() => setConfirmAction({
                title: '取消預設選單',
                message: '確認取消目前的預設選單？使用者將不會看到選單。',
                onConfirm: () => doAction('unset-default'),
              })}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-600/30 disabled:opacity-50 cursor-pointer"
            >
              取消預設
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400 animate-pulse">載入中…</p>
        ) : menus.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">尚無 Rich Menu</p>
            <p className="text-xs text-slate-600 mt-1">使用上方模板快速建立</p>
          </div>
        ) : (
          menus.map((menu) => {
            const isDefault = menu.richMenuId === defaultId
            return (
              <div
                key={menu.richMenuId}
                className={`bg-slate-800/80 rounded-xl p-4 border ${isDefault ? 'border-t-accent' : 'border-slate-700'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isDefault && (
                        <span className="bg-t-btn text-white text-xs px-2 py-0.5 rounded font-medium">預設</span>
                      )}
                      <h3 className="text-white font-medium">{menu.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                      <span className="bg-slate-700 px-2 py-0.5 rounded">{menu.areas.length} 個按鈕</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded">「{menu.chatBarText}」</span>
                    </div>
                    <p className="text-slate-600 text-[10px] font-mono">{menu.richMenuId}</p>

                    <div className="mt-3 space-y-1">
                      {menu.areas.map((area, i) => (
                        <div key={i} className="text-xs text-slate-400 flex gap-2 flex-wrap">
                          <span className="text-slate-500">#{i + 1}</span>
                          <span className="text-slate-300">{area.action.label || area.action.text || '—'}</span>
                          <span className="text-slate-500">({area.action.type})</span>
                          {area.action.uri && (
                            <span className="text-t-accent truncate max-w-[300px]">{area.action.uri}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!isDefault && (
                      <button
                        onClick={() => setConfirmAction({
                          title: '設為預設選單',
                          message: `確認將「${menu.name}」設為所有使用者的預設選單？`,
                          onConfirm: () => doAction('set-default', menu.richMenuId),
                        })}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-t-accent-bg text-t-accent rounded-lg text-xs hover:opacity-80 disabled:opacity-50 cursor-pointer"
                      >
                        設為預設
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmAction({
                        title: '刪除 Rich Menu',
                        message: `確認刪除「${menu.name}」？此操作無法復原。`,
                        onConfirm: () => doAction('delete', menu.richMenuId),
                      })}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* 確認 Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">{confirmAction.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500 cursor-pointer">取消</button>
              <button onClick={confirmAction.onConfirm} disabled={actionLoading}
                className="px-4 py-2 bg-t-btn text-white rounded-lg text-sm hover:bg-t-btn-hover disabled:opacity-50 cursor-pointer">確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

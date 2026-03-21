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

export default function RichMenuPage() {
  const [menus, setMenus] = useState<RichMenu[]>([])
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

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

  function handleSetDefault(menu: RichMenu) {
    setConfirmAction({
      title: '設為預設選單',
      message: `確認將「${menu.name}」設為所有使用者的預設選單？`,
      onConfirm: () => doAction('set-default', menu.richMenuId),
    })
  }

  function handleDelete(menu: RichMenu) {
    setConfirmAction({
      title: '刪除 Rich Menu',
      message: `確認刪除「${menu.name}」？此操作無法復原。`,
      onConfirm: () => doAction('delete', menu.richMenuId),
    })
  }

  function handleUnsetDefault() {
    setConfirmAction({
      title: '取消預設選單',
      message: '確認取消目前的預設選單？使用者將不會看到選單。',
      onConfirm: () => doAction('unset-default'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Rich Menu 管理</h1>
        {defaultId && (
          <button
            onClick={handleUnsetDefault}
            disabled={actionLoading}
            className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30 text-sm disabled:opacity-50"
          >
            取消預設選單
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-400">
          Rich Menu 透過 LINE Messaging API 管理。如需建立新 Rich Menu，請在終端機執行：
        </p>
        <code className="block mt-2 text-sm text-green-300 bg-slate-900 p-2 rounded">
          node --env-file=.env.local scripts/setup-rich-menu.mjs
        </code>
      </div>

      {loading ? (
        <p className="text-slate-400">載入中…</p>
      ) : menus.length === 0 ? (
        <p className="text-slate-400">尚無 Rich Menu，請先執行建立腳本</p>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => {
            const isDefault = menu.richMenuId === defaultId
            return (
              <div
                key={menu.richMenuId}
                className={`bg-slate-800/80 rounded-lg p-4 border ${
                  isDefault ? 'border-t-accent' : 'border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isDefault && (
                        <span className="bg-t-btn text-white text-xs px-2 py-0.5 rounded font-medium">預設</span>
                      )}
                      <h3 className="text-white font-medium">{menu.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                      <span className="bg-slate-700 px-2 py-0.5 rounded">
                        {menu.size.width} × {menu.size.height}
                      </span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded">
                        {menu.areas.length} 個按鈕
                      </span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded">
                        「{menu.chatBarText}」
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs font-mono">{menu.richMenuId}</p>

                    {/* 按鈕區域列表 */}
                    <div className="mt-3 space-y-1">
                      {menu.areas.map((area, i) => (
                        <div key={i} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-slate-500">#{i + 1}</span>
                          <span className="text-slate-300">{area.action.label || area.action.text || '—'}</span>
                          <span className="text-slate-500">({area.action.type})</span>
                          {area.action.uri && (
                            <span className="text-t-accent truncate max-w-[200px]">{area.action.uri}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(menu)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-t-accent-bg text-t-accent rounded text-xs hover:bg-t-accent-bg disabled:opacity-50"
                      >
                        設為預設
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(menu)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30 disabled:opacity-50"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
              <button onClick={confirmAction.onConfirm} disabled={actionLoading} className="px-4 py-2 bg-t-btn text-white rounded text-sm hover:bg-t-btn-hover disabled:opacity-50">確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

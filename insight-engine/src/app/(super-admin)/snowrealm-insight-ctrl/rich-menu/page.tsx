'use client'

import { useState, useEffect } from 'react'

interface RichMenuInfo {
  richMenuId: string
  name: string
  chatBarText: string
  areas: number
}

export default function SuperAdminRichMenuPage() {
  const [menus, setMenus] = useState<RichMenuInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [defaultMenuId, setDefaultMenuId] = useState('')
  const [postSurveyMenuId, setPostSurveyMenuId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMenus()
  }, [])

  async function loadMenus() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rich-menu')
      const data = await res.json()
      setMenus(Array.isArray(data.menus) ? data.menus : [])
    } catch {
      setMenus([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveIds() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/line-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { key: 'DEFAULT_RICH_MENU_ID', value: defaultMenuId },
          { key: 'POST_SURVEY_RICH_MENU_ID', value: postSurveyMenuId },
        ]),
      })
      setMsg(res.ok ? '已儲存' : '儲存失敗')
    } catch {
      setMsg('網路錯誤')
    } finally {
      setSaving(false)
    }
  }

  function handleCopyId(richMenuId: string) {
    navigator.clipboard.writeText(richMenuId)
    setMsg('已複製 ID')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📱 Rich Menu 管理</h1>
        <p className="text-sm text-slate-400 mt-1">管理 LINE Official Bot 的預設 Rich Menu</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Rich Menu ID 設定</h2>
        <p className="text-xs text-slate-500">
          在 LINE Official Account Manager 建立 Rich Menu 後，將 ID 填入此處。格式：richmenu-xxxxxxxx
        </p>
        <div>
          <label className="block text-sm text-slate-400 mb-1">預設 Rich Menu ID（新好友加入時）</label>
          <input
            value={defaultMenuId}
            onChange={e => setDefaultMenuId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="richmenu-xxxxxxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">填答完成後 Rich Menu ID</label>
          <input
            value={postSurveyMenuId}
            onChange={e => setPostSurveyMenuId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="richmenu-xxxxxxxxxxxxxxxx"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveIds}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            {saving ? '儲存中...' : '儲存 ID 設定'}
          </button>
          {msg && (
            <span className={`text-sm ${msg.includes('失敗') || msg.includes('錯誤') ? 'text-red-400' : 'text-green-400'}`}>
              {msg}
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">現有 Rich Menu 列表</h2>
        {loading ? (
          <div className="text-slate-400 text-sm">載入中...</div>
        ) : menus.length === 0 ? (
          <div className="text-slate-500 text-sm">尚未建立任何 Rich Menu，或 LINE Channel Token 未設定</div>
        ) : (
          <div className="space-y-2">
            {menus.map(m => (
              <div key={m.richMenuId} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                <div>
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{m.richMenuId}</p>
                  <p className="text-slate-400 text-xs">
                    {m.chatBarText} · {m.areas} 個按鈕
                  </p>
                </div>
                <button
                  onClick={() => handleCopyId(m.richMenuId)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded text-xs transition-colors cursor-pointer"
                >
                  複製 ID
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">使用說明</h3>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Rich Menu 需先在 LINE Official Account Manager 建立後，再將 ID 填入此處</li>
          <li>「預設 Rich Menu」會在新好友加入時自動套用</li>
          <li>「填答完成後 Rich Menu」會在用戶填完問卷後自動切換</li>
          <li>Rich Menu ID 格式為 richmenu- 開頭，後接 32 碼英數字</li>
        </ul>
      </div>
    </div>
  )
}

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

interface MenuButton {
  emoji: string
  label: string
  actionType: 'uri' | 'message'
  actionValue: string
  bg: string
}

interface TemplatePreset {
  name: string
  chatBarText: string
  buttons: MenuButton[]
}

const TEMPLATES = [
  { id: 'official', label: '官方帳號', desc: '填問卷、封測、IG、官網、消息、聯絡', channel: 'official' as const },
  { id: 'admin', label: '後台管理', desc: '數據總覽、填答、標籤、問卷、漏斗、填寫', channel: 'insight' as const },
]

const CLI_SNIPPET = `# 在專案 insight-engine 目錄執行（本機）
# 腳本會自動讀取 .env + .env.local

node scripts/setup-rich-menu.mjs
node scripts/setup-insight-rich-menu.mjs`

export default function RichMenuPage() {
  const [menus, setMenus] = useState<RichMenu[]>([])
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [presets, setPresets] = useState<Record<string, TemplatePreset> | null>(null)
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [editorBase, setEditorBase] = useState<'official' | 'admin'>('official')
  const [editorChannel, setEditorChannel] = useState<'official' | 'insight'>('official')
  const [editorMenuName, setEditorMenuName] = useState('')
  const [editorChatBar, setEditorChatBar] = useState('')
  const [editorButtons, setEditorButtons] = useState<MenuButton[]>([])

  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [copiedCli, setCopiedCli] = useState(false)

  const applyPresetToEditor = useCallback(
    (base: 'official' | 'admin', channel?: 'official' | 'insight') => {
      const p = presets?.[base]
      if (!p) return
      setEditorBase(base)
      if (channel) setEditorChannel(channel)
      setEditorMenuName(p.name)
      setEditorChatBar(p.chatBarText)
      setEditorButtons(p.buttons.map((b) => ({ ...b })))
    },
    [presets],
  )

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rich-menu')
      if (res.ok) {
        const data = await res.json()
        setMenus(data.menus ?? [])
        setDefaultId(data.defaultId ?? null)
        if (data.presets) setPresets(data.presets)
        if (Array.isArray(data.placeholders)) setPlaceholders(data.placeholders)
      }
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  useEffect(() => {
    if (!presets) return
    if (editorButtons.length === 0) applyPresetToEditor('official', 'official')
  }, [presets, editorButtons.length, applyPresetToEditor])

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

  async function handleCreateFromEditor() {
    if (editorButtons.length !== 6) {
      setCreateMsg({ ok: false, text: '需要剛好 6 個按鈕' })
      return
    }
    for (const b of editorButtons) {
      if (!b.label.trim()) {
        setCreateMsg({ ok: false, text: '每個按鈕都要有標籤' })
        return
      }
      if (!b.actionValue.trim()) {
        setCreateMsg({ ok: false, text: '請填寫每個按鈕的網址或訊息文字' })
        return
      }
    }
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/admin/rich-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          template: editorBase,
          channel: editorChannel,
          menuName: editorMenuName.trim() || undefined,
          chatBarText: editorChatBar.trim() || undefined,
          buttons: editorButtons,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateMsg({ ok: true, text: `已依編輯內容建立並設為預設 (${data.richMenuId})` })
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

  function updateButton(i: number, patch: Partial<MenuButton>) {
    setEditorButtons((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  }

  async function copyCli() {
    try {
      await navigator.clipboard.writeText(CLI_SNIPPET)
      setCopiedCli(true)
      setTimeout(() => setCopiedCli(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const inputCls =
    'w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-xs focus:border-t-accent-border focus:outline-none'
  const labelCls = 'block text-[10px] text-slate-500 mb-0.5'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Rich Menu 管理</h1>
      {createMsg && (
        <div
          className={`rounded-lg px-4 py-2 text-sm border ${
            createMsg.ok
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              : 'bg-red-500/10 text-red-400 border-red-500/25'
          }`}
        >
          {createMsg.text}
        </div>
      )}

      {/* 從模板建立 */}
      <section className="bg-t-card-bg border border-t-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white/90">從模板建立</h2>
        <p className="text-sm text-slate-400">
          選擇模板一鍵建立 Rich Menu，自動產生圖片並設為預設。URL 根據環境變數與佔位符替換。
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
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateFromTemplate(t.id, t.channel)}
                  disabled={creating}
                  className="w-full px-3 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {creating ? '建立中...' : '建立並設為預設'}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToEditor(t.id as 'official' | 'admin', t.channel)}
                  className="w-full px-3 py-1.5 bg-slate-700/80 text-slate-300 rounded-lg text-xs hover:bg-slate-600 cursor-pointer"
                >
                  載入到下方編輯器
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 進階編輯 */}
      <section className="bg-t-card-bg border border-t-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white/90">進階：自訂按鈕後建立</h2>
        <p className="text-sm text-slate-400">
          可修改標籤、網址或訊息文字、底色。URI 可使用佔位符（儲存前由伺服器依租戶替換）。
        </p>
        {placeholders.length > 0 && (
          <p className="text-xs text-slate-500 font-mono break-all">
            佔位符：{placeholders.join(' · ')}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>發布到哪個 Bot</label>
            <select
              value={editorChannel}
              onChange={(e) => setEditorChannel(e.target.value as 'official' | 'insight')}
              className={inputCls}
            >
              <option value="official">Official（官方帳號）</option>
              <option value="insight">Insight（足跡／問卷帳號）</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>版型基底（決定預設配色與名稱後援）</label>
            <select
              value={editorBase}
              onChange={(e) => {
                const v = e.target.value as 'official' | 'admin'
                setEditorBase(v)
                applyPresetToEditor(v, editorChannel)
              }}
              className={inputCls}
            >
              <option value="official">官方 6 格</option>
              <option value="admin">後台 6 格</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>選單名稱（LINE 後台）</label>
            <input
              type="text"
              value={editorMenuName}
              onChange={(e) => setEditorMenuName(e.target.value)}
              className={inputCls}
              placeholder="例如：毛行天下選單 v3"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>聊天室選單列文字</label>
            <input
              type="text"
              value={editorChatBar}
              onChange={(e) => setEditorChatBar(e.target.value)}
              className={inputCls}
              placeholder="例如：📋 打開選單"
            />
          </div>
        </div>

        <div className="space-y-3">
          {editorButtons.map((btn, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/80"
            >
              <div className="md:col-span-1">
                <label className={labelCls}>圖示</label>
                <input
                  type="text"
                  value={btn.emoji}
                  onChange={(e) => updateButton(i, { emoji: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>按鈕文字</label>
                <input
                  type="text"
                  value={btn.label}
                  onChange={(e) => updateButton(i, { label: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>動作</label>
                <select
                  value={btn.actionType}
                  onChange={(e) => updateButton(i, { actionType: e.target.value as 'uri' | 'message' })}
                  className={inputCls}
                >
                  <option value="uri">開啟連結 (uri)</option>
                  <option value="message">傳送文字 (message)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelCls}>底色 (#hex)</label>
                <input
                  type="text"
                  value={btn.bg}
                  onChange={(e) => updateButton(i, { bg: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-4">
                <label className={labelCls}>
                  {btn.actionType === 'uri' ? '網址或佔位符' : '訊息內容'}
                </label>
                <textarea
                  value={btn.actionValue}
                  onChange={(e) => updateButton(i, { actionValue: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-y min-h-[2.5rem]`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPresetToEditor(editorBase, editorChannel)}
            disabled={!presets}
            className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
          >
            還原為目前基底模板
          </button>
          <button
            type="button"
            onClick={handleCreateFromEditor}
            disabled={creating || editorButtons.length !== 6}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            {creating ? '建立中…' : '依編輯內容建立並設為預設'}
          </button>
        </div>
      </section>

      {/* 本機指令（終端機樣式，僅複製 — 不從瀏覽器執行任意 shell） */}
      <section className="bg-t-card-bg border border-t-card-border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white/90">本機指令控制台</h2>
        <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
          <strong>安全說明：</strong>
          無法在網頁內直接替你執行終端機指令（會造成任意指令執行風險）。以下為
          <strong>本機開發／CI</strong>
          用的腳本，請複製到電腦終端機執行；與後台「建立」使用相同 LINE API 邏輯。
        </p>
        <div className="relative rounded-lg border border-emerald-500/30 bg-[#0d1117] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40">
            <span className="text-[10px] text-slate-500 font-mono">bash — insight-engine</span>
            <button
              type="button"
              onClick={copyCli}
              className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
            >
              {copiedCli ? '已複製' : '複製全部'}
            </button>
          </div>
          <pre className="p-4 text-xs text-green-400/95 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {CLI_SNIPPET}
          </pre>
        </div>
      </section>

      {/* 現有選單列表 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90">現有選單</h2>
          {defaultId && (
            <button
              type="button"
              onClick={() =>
                setConfirmAction({
                  title: '取消預設選單',
                  message: '確認取消目前的預設選單？使用者將不會看到選單。',
                  onConfirm: () => doAction('unset-default'),
                })
              }
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
            <p className="text-xs text-slate-600 mt-1">使用上方模板或進階編輯建立</p>
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
                    <p className="text-[10px] text-slate-600 mt-2">
                      LINE 不支援直接修改既有 Rich Menu；若要改內容請用上方「進階」建立新版後刪除舊版，或在本機跑腳本。
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            title: '設為預設選單',
                            message: `確認將「${menu.name}」設為所有使用者的預設選單？`,
                            onConfirm: () => doAction('set-default', menu.richMenuId),
                          })
                        }
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-t-accent-bg text-t-accent rounded-lg text-xs hover:opacity-80 disabled:opacity-50 cursor-pointer"
                      >
                        設為預設
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          title: '刪除 Rich Menu',
                          message: `確認刪除「${menu.name}」？此操作無法復原。`,
                          onConfirm: () => doAction('delete', menu.richMenuId),
                        })
                      }
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

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">{confirmAction.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmAction.onConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-t-btn text-white rounded-lg text-sm hover:bg-t-btn-hover disabled:opacity-50 cursor-pointer"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'

interface WaitlistEntry {
  id: string
  email: string
  nickname: string
  contact_info: string
  response_id: string | null
  source: string | null
  created_at: string
}

const EMPTY_FORM = { email: '', nickname: '', contact_info: '', source: 'admin' }

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Add
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addError, setAddError] = useState('')

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  // Batch delete
  const [batchMode, setBatchMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // Confirm
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/waitlist')
      if (res.ok) {
        const json = await res.json()
        setEntries(json.data)
        setTotal(json.total)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  // ---- Add ----
  async function handleAdd() {
    setAddError('')
    const res = await fetch('/api/admin/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (res.ok) {
      setShowAdd(false)
      setAddForm(EMPTY_FORM)
      setToast('已新增')
      fetchEntries()
    } else {
      const data = await res.json().catch(() => ({}))
      setAddError(data.error ?? '新增失敗')
    }
  }

  // ---- Edit ----
  function startEdit(entry: WaitlistEntry) {
    setEditingId(entry.id)
    setEditForm({
      email: entry.email,
      nickname: entry.nickname ?? '',
      contact_info: entry.contact_info ?? '',
      source: entry.source ?? '',
    })
  }

  async function handleSaveEdit(id: string) {
    const res = await fetch('/api/admin/waitlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    if (res.ok) {
      setEditingId(null)
      setToast('已儲存')
      fetchEntries()
    } else {
      setToast('儲存失敗')
    }
  }

  // ---- Delete ----
  function handleDelete(entry: WaitlistEntry) {
    setConfirm({
      message: `確認刪除「${entry.email}」？`,
      onConfirm: async () => {
        await fetch('/api/admin/waitlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [entry.id] }),
        })
        setConfirm(null)
        setToast('已刪除')
        fetchEntries()
      },
    })
  }

  function enterBatchMode(entry: WaitlistEntry) {
    setBatchMode(true)
    setSelected(new Set([entry.id]))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === entries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(entries.map((e) => e.id)))
    }
  }

  function handleBatchDelete() {
    if (selected.size === 0) return
    setConfirm({
      message: `確認刪除選取的 ${selected.size} 筆？`,
      onConfirm: async () => {
        await fetch('/api/admin/waitlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [...selected] }),
        })
        setConfirm(null)
        setBatchMode(false)
        setSelected(new Set())
        setToast(`已刪除 ${selected.size} 筆`)
        fetchEntries()
      },
    })
  }

  function exitBatchMode() {
    setBatchMode(false)
    setSelected(new Set())
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">封測名單</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#8a7ca8]">共 {total} 人</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] text-white rounded-lg hover:opacity-90 text-sm transition-colors cursor-pointer"
          >
            {showAdd ? '取消' : '+ 新增'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 text-[#3d3155] px-4 py-2 rounded-lg shadow-lg border border-[#b8a9e8]/30 text-sm animate-pulse">
          {toast}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/50 border border-[#b8a9e8]/20 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="text-[#3d3155]">{confirm.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm bg-[#b8a9e8]/10 text-slate-300 hover:bg-[#b8a9e8]/15 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={confirm.onConfirm}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-[#b8a9e8]/20">
          <h3 className="text-[#3d3155] font-medium">新增封測成員</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Email *"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm"
            />
            <input
              placeholder="暱稱"
              value={addForm.nickname}
              onChange={(e) => setAddForm({ ...addForm, nickname: e.target.value })}
              className="bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm"
            />
            <input
              placeholder="聯繫方式（LINE ID 或電話）"
              value={addForm.contact_info}
              onChange={(e) => setAddForm({ ...addForm, contact_info: e.target.value })}
              className="bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm"
            />
            <input
              placeholder="來源"
              value={addForm.source}
              onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
              className="bg-white/60 text-[#3d3155] px-3 py-2 rounded border border-[#b8a9e8]/30 text-sm"
            />
          </div>
          {addError && <p className="text-red-400 text-sm">{addError}</p>}
          <button
            onClick={handleAdd}
            disabled={!addForm.email}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 cursor-pointer"
          >
            確認新增
          </button>
        </div>
      )}

      {/* Batch bar */}
      {batchMode && (
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl px-4 py-3">
          <button
            onClick={exitBatchMode}
            className="text-sm text-[#8a7ca8] hover:text-[#3d3155] cursor-pointer"
          >
            取消選取
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">已選取 {selected.size} 筆</span>
            <button
              onClick={handleBatchDelete}
              disabled={selected.size === 0}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              刪除選取
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-[#8a7ca8] animate-pulse">載入中…</p>
      ) : entries.length === 0 ? (
        <div className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-[20px] p-8 text-center text-[#3d3155]0">
          尚無報名資料
        </div>
      ) : (
        <div className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#b8a9e8]/20">
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">暱稱</th>
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">聯繫方式</th>
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">來源</th>
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">加入時間</th>
                  <th className="text-left px-4 py-3 text-[#8a7ca8] font-medium">操作</th>
                  {batchMode && (
                    <th className="px-4 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selected.size === entries.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-t-accent cursor-pointer"
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isEditing = editingId === entry.id
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-[#b8a9e8]/10 hover:bg-[#b8a9e8]/8"
                    >
                      {/* 暱稱 */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.nickname}
                            onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                            className="bg-white/60 text-[#3d3155] px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm w-full"
                          />
                        ) : (
                          <span className="text-[#3d3155]">{entry.nickname || <span className="text-slate-600">—</span>}</span>
                        )}
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="bg-white/60 text-[#3d3155] px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm w-full"
                          />
                        ) : (
                          <span className="text-[#3d3155]">{entry.email}</span>
                        )}
                      </td>
                      {/* 聯繫方式 */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.contact_info}
                            onChange={(e) => setEditForm({ ...editForm, contact_info: e.target.value })}
                            className="bg-white/60 text-[#3d3155] px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm w-full"
                          />
                        ) : (
                          <span className="text-t-accent/80">{entry.contact_info || <span className="text-slate-600">—</span>}</span>
                        )}
                      </td>
                      {/* 來源 */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editForm.source}
                            onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                            className="bg-white/60 text-[#3d3155] px-2 py-1 rounded border border-[#b8a9e8]/30 text-sm w-full"
                          />
                        ) : (
                          <span className="text-[#8a7ca8]">{entry.source ?? '—'}</span>
                        )}
                      </td>
                      {/* 時間 */}
                      <td className="px-4 py-3 text-[#8a7ca8] whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveEdit(entry.id)}
                              className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                            >
                              儲存
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded text-xs bg-[#b8a9e8]/10 text-slate-300 hover:bg-[#b8a9e8]/15 cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(entry)}
                              className="px-2 py-1 rounded text-xs bg-[#b8a9e8]/20 text-t-accent hover:bg-[#b8a9e8]/20 cursor-pointer"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => batchMode ? toggleSelect(entry.id) : enterBatchMode(entry)}
                              className="px-2 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 cursor-pointer"
                            >
                              刪除
                            </button>
                          </div>
                        )}
                      </td>
                      {/* Checkbox */}
                      {batchMode && (
                        <td className="px-4 py-3 text-right">
                          <input
                            type="checkbox"
                            checked={selected.has(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="w-4 h-4 accent-t-accent cursor-pointer"
                          />
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

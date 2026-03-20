'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ResponseListItem } from '@/types'

interface ResponseTableProps {
  responses: ResponseListItem[]
  showPagination?: boolean
  currentPage?: number
  totalPages?: number
  paginationBase?: string
}

export function ResponseTable({
  responses,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  paginationBase = '/admin/responses?',
}: ResponseTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // 批次選取
  const [batchMode, setBatchMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [confirmBatch, setConfirmBatch] = useState(false)

  const allIds = responses.map((r) => r.id)
  const isAllSelected = responses.length > 0 && allIds.every((id) => selected.has(id))
  const selectedCount = selected.size

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  async function handleBatchDelete() {
    if (selected.size === 0) return
    setBatchDeleting(true)
    try {
      const res = await fetch('/api/admin/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        setConfirmBatch(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '批次刪除失敗')
      }
    } catch {
      alert('批次刪除失敗，請稍後再試')
    } finally {
      setBatchDeleting(false)
    }
  }

  if (responses.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500">
        尚無填答資料
      </div>
    )
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/responses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '刪除失敗')
      }
    } catch {
      alert('刪除失敗，請稍後再試')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* 批次操作列 */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 bg-slate-700/40 border-b border-slate-700/50">
          <button
            onClick={() => { setSelected(new Set()); setConfirmBatch(false); setBatchMode(false) }}
            className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
          >
            取消選取
          </button>
          <span className="ml-auto text-sm text-slate-300">
            已選取 <span className="text-cyan-400 font-medium">{selectedCount}</span> 筆
          </span>
          {confirmBatch ? (
            <span className="flex items-center gap-2">
              <button
                onClick={handleBatchDelete}
                disabled={batchDeleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {batchDeleting ? '刪除中...' : `確認刪除 ${selectedCount} 筆`}
              </button>
              <button
                onClick={() => setConfirmBatch(false)}
                className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                取消
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmBatch(true)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors cursor-pointer"
            >
              刪除選取
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                時間
              </th>
              <th className="text-left px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                狀態
              </th>
              <th className="text-left px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                來源
              </th>
              <th className="text-left px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                標籤
              </th>
              <th className="text-center px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                LINE
              </th>
              <th className="text-center px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                IG
              </th>
              <th className="text-left px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                備註
              </th>
              <th className="text-right px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                操作
              </th>
              {batchMode && (
                <th className="w-10 px-3 sm:px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer accent-cyan-500"
                    title="全選本頁"
                  />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr
                key={response.id}
                className={`border-b border-slate-700/30 hover:bg-slate-700/20 ${
                  selected.has(response.id) ? 'bg-cyan-500/5' : ''
                }`}
              >
                <td className="px-4 sm:px-6 py-3 text-slate-300 whitespace-nowrap">
                  {formatDateTime(response.submittedAt ?? response.createdAt)}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <StatusBadge status={response.status} />
                </td>
                <td className="px-4 sm:px-6 py-3 text-slate-400">
                  {response.utmSource ?? response.source ?? '-'}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {response.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={`${tag.key}-${tag.value}-${i}`}
                        className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs"
                      >
                        {tag.key}: {tag.value}
                      </span>
                    ))}
                    {response.tags.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{response.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 text-center">
                  {response.clickEvents?.some((e) => e.eventType === 'line_friend')
                    ? <span className="text-green-400">✓</span>
                    : <span className="text-slate-600">-</span>}
                </td>
                <td className="px-4 sm:px-6 py-3 text-center">
                  {response.clickEvents?.some((e) => e.eventType === 'instagram')
                    ? <span className="text-purple-400">✓</span>
                    : <span className="text-slate-600">-</span>}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <NotesCell responseId={response.id} initialNotes={response.notes} />
                </td>
                <td className="px-4 sm:px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-4 sm:gap-2">
                    <Link
                      href={`/admin/responses/${response.id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm px-2 py-1 -mx-2 -my-1"
                    >
                      查看
                    </Link>
                    {confirmId === response.id ? (
                      <span className="flex items-center gap-3 sm:gap-1">
                        <button
                          onClick={() => handleDelete(response.id)}
                          disabled={deletingId === response.id}
                          className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 cursor-pointer px-2 py-1 -mx-2 -my-1"
                        >
                          {deletingId === response.id ? '刪除中...' : '確認'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer px-2 py-1 -mx-2 -my-1"
                        >
                          取消
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setBatchMode(true)
                          setSelected(new Set([response.id]))
                        }}
                        className="text-red-500/60 hover:text-red-400 text-sm cursor-pointer px-2 py-1 -mx-2 -my-1"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </td>
                {batchMode && (
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(response.id)}
                      onChange={() => toggleOne(response.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer accent-cyan-500"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-700/50">
          {currentPage > 1 && (
            <Link
              href={`${paginationBase}page=${currentPage - 1}`}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              ← 上一頁
            </Link>
          )}
          <span className="text-sm text-slate-400">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`${paginationBase}page=${currentPage + 1}`}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              下一頁 →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'completed'
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${
        isCompleted
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-amber-500/20 text-amber-400'
      }`}
    >
      {isCompleted ? '已完成' : '進行中'}
    </span>
  )
}

function formatDateTime(isoString: string): string {
  const d = new Date(isoString)
  // Manually format to avoid locale-dependent hydration mismatch
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

function NotesCell({ responseId, initialNotes }: { responseId: string; initialNotes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/responses/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '儲存失敗')
      }
    } catch {
      alert('儲存失敗')
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[140px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={500}
          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          disabled={saving}
        />
        <button onClick={save} disabled={saving} className="text-cyan-400 hover:text-cyan-300 text-xs cursor-pointer">✓</button>
        <button onClick={() => { setValue(initialNotes ?? ''); setEditing(false) }} className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer">✕</button>
      </div>
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="text-slate-400 text-xs cursor-pointer hover:text-slate-200 max-w-[160px] truncate inline-block"
      title={value || '點擊新增備註'}
    >
      {value || <span className="text-slate-600">—</span>}
    </span>
  )
}

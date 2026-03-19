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
              <th className="text-right px-4 sm:px-6 py-3 text-slate-400 font-medium whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr
                key={response.id}
                className="border-b border-slate-700/30 hover:bg-slate-700/20"
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
                    {response.tags.slice(0, 3).map((tag) => (
                      <span
                        key={`${tag.key}-${tag.value}`}
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
                <td className="px-4 sm:px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/responses/${response.id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      查看
                    </Link>
                    {confirmId === response.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(response.id)}
                          disabled={deletingId === response.id}
                          className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === response.id ? '刪除中...' : '確認'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer"
                        >
                          取消
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(response.id)}
                        className="text-red-500/60 hover:text-red-400 text-sm cursor-pointer"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </td>
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
  const date = new Date(isoString)
  return date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

import Link from 'next/link'
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
  if (responses.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500">
        尚無填答資料
      </div>
    )
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
                <td className="px-4 sm:px-6 py-3 text-right">
                  <Link
                    href={`/admin/responses/${response.id}`}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    查看
                  </Link>
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

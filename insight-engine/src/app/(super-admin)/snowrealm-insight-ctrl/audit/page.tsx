'use client'

import { useEffect, useState, useCallback } from 'react'

interface AuditLog {
  id: string
  actor_id: string
  actor_name: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

const PAGE_SIZE = 50

const ACTION_OPTIONS = [
  { value: '', label: '全部動作' },
  { value: 'login', label: '登入' },
  { value: 'logout', label: '登出' },
  { value: 'create_survey', label: '建立問卷' },
  { value: 'update_survey', label: '更新問卷' },
  { value: 'delete_survey', label: '刪除問卷' },
  { value: 'create_tenant', label: '建立租戶' },
  { value: 'update_tenant', label: '更新租戶' },
  { value: 'update_user', label: '更新使用者' },
  { value: 'update_settings', label: '更新設定' },
  { value: 'export_data', label: '匯出資料' },
]

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      if (actionFilter) params.set('action', actionFilter)
      if (actorSearch.trim()) params.set('actorId', actorSearch.trim())

      const res = await fetch(`/api/super-admin/audit?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(json.data ?? [])
        setTotal(json.total ?? 0)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, actionFilter, actorSearch])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function handleFilterChange(action: string) {
    setActionFilter(action)
    setPage(1)
  }

  function handleActorSearch(value: string) {
    setActorSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">操作審計紀錄</h1>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-sm cursor-pointer"
        >
          重新整理
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-slate-500">總紀錄數</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-2xl font-bold text-amber-400">{totalPages}</p>
          <p className="text-xs text-slate-500">總頁數</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-2xl font-bold text-emerald-400">{page}</p>
          <p className="text-xs text-slate-500">目前頁碼</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="搜尋操作者 ID…"
          value={actorSearch}
          onChange={(e) => handleActorSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 flex-1"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-slate-400 animate-pulse">載入中…</p>
      ) : logs.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-500">目前無審計紀錄</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">時間</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">操作者</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">動作</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">目標</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">詳情</th>
                  <th className="pb-2 font-medium whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap text-xs">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-white text-xs">{log.actor_name || log.actor_id}</span>
                      {log.actor_name && (
                        <span className="block text-[10px] text-slate-500 truncate max-w-[120px]">{log.actor_id}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">
                      {log.target_type && (
                        <span className="text-slate-300">{log.target_type}</span>
                      )}
                      {log.target_id && (
                        <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">{log.target_id}</span>
                      )}
                      {!log.target_type && !log.target_id && <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      {log.details ? (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          {expandedId === log.id ? '收起' : '展開'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-xs text-slate-500 font-mono">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded Details */}
          {expandedId && (() => {
            const expandedLog = logs.find((l) => l.id === expandedId)
            if (!expandedLog?.details) return null
            return (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">詳細資訊</span>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs text-slate-500 hover:text-white cursor-pointer"
                  >
                    關閉
                  </button>
                </div>
                <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                  {JSON.stringify(expandedLog.details, null, 2)}
                </pre>
              </div>
            )
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-sm disabled:opacity-30 cursor-pointer"
              >
                上一頁
              </button>
              <span className="text-xs text-slate-500">
                第 {page} 頁 / 共 {totalPages} 頁
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-sm disabled:opacity-30 cursor-pointer"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'

interface Ticket {
  id: string
  tenant_id: string
  tenant_name: string | null
  channel: string
  email: string | null
  status: string
  priority: string
  category: string | null
  subject: string | null
  created_at: string
  updated_at: string
  last_message: string | null
  last_message_at: string | null
  message_count: number
}

interface Stats { open: number; inProgress: number; resolved: number; closed: number }

const STATUS_LABELS: Record<string, string> = { open: '待處理', in_progress: '處理中', resolved: '已解決', closed: '已關閉' }
const STATUS_COLORS: Record<string, string> = { open: 'bg-red-500', in_progress: 'bg-amber-500', resolved: 'bg-emerald-500', closed: 'bg-slate-500' }
const PRIORITY_LABELS: Record<string, string> = { low: '低', normal: '一般', high: '高', urgent: '緊急' }
const PRIORITY_COLORS: Record<string, string> = { low: 'text-slate-400', normal: 'text-blue-400', high: 'text-amber-400', urgent: 'text-red-400' }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '剛剛'
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  return `${Math.floor(h / 24)} 天前`
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, closed: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/super-admin/support?${params}`)
      if (res.ok) {
        const json = await res.json()
        setTickets(json.data ?? [])
        setTotal(json.total ?? 0)
        setStats(json.stats ?? { open: 0, inProgress: 0, resolved: 0, closed: 0 })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [statusFilter, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  async function updateTicket(ticketId: string, status: string) {
    await fetch('/api/super-admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, status }),
    })
    fetchTickets()
  }

  const totalTickets = stats.open + stats.inProgress + stats.resolved + stats.closed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">全平台客服工單</h1>
        <button onClick={fetchTickets} className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-sm cursor-pointer">
          重新整理
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: '全部', value: totalTickets, filter: '' },
          { label: '待處理', value: stats.open, filter: 'open', color: 'text-red-400' },
          { label: '處理中', value: stats.inProgress, filter: 'in_progress', color: 'text-amber-400' },
          { label: '已解決', value: stats.resolved, filter: 'resolved', color: 'text-emerald-400' },
          { label: '已關閉', value: stats.closed, filter: 'closed', color: 'text-slate-400' },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => { setStatusFilter(s.filter); setPage(1) }}
            className={`bg-slate-800/80 rounded-xl p-3 text-center border transition-colors cursor-pointer ${
              statusFilter === s.filter ? 'border-amber-500/50' : 'border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <p className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <p className="text-slate-400 animate-pulse">載入中…</p>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-500">目前無工單</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-slate-500'}`} />
                    <span className="text-white font-medium text-sm truncate">{t.subject || '(無主題)'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                      {t.tenant_name || t.tenant_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span>{STATUS_LABELS[t.status]}</span>
                    <span className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</span>
                    {t.category && <span className="bg-slate-700 px-1.5 py-0.5 rounded">{t.category}</span>}
                    <span>{t.message_count} 則訊息</span>
                    <span>{timeAgo(t.updated_at)}</span>
                    {t.email && <span className="text-slate-600">{t.email}</span>}
                  </div>
                  {t.last_message && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{t.last_message}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {t.status === 'open' && (
                    <button onClick={() => updateTicket(t.id, 'in_progress')}
                      className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs hover:bg-amber-500/30 cursor-pointer">
                      處理中
                    </button>
                  )}
                  {(t.status === 'open' || t.status === 'in_progress') && (
                    <button onClick={() => updateTicket(t.id, 'resolved')}
                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 cursor-pointer">
                      解決
                    </button>
                  )}
                  {t.status !== 'closed' && (
                    <button onClick={() => updateTicket(t.id, 'closed')}
                      className="px-2.5 py-1 bg-slate-600/30 text-slate-400 rounded-lg text-xs hover:bg-slate-600/50 cursor-pointer">
                      關閉
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 30 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-sm disabled:opacity-30 cursor-pointer"
              >
                上一頁
              </button>
              <span className="text-xs text-slate-500">第 {page} 頁 / 共 {Math.ceil(total / 30)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 30)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-sm disabled:opacity-30 cursor-pointer"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

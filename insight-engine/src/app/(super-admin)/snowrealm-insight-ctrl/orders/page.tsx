'use client'

import { useEffect, useState, useCallback } from 'react'

interface Order {
  id: string
  user_id: string | null
  amount: number
  zcoin_amount: number | null
  payment_method: string
  status: string
  merchant_order_no: string | null
  created_at: string
  completed_at: string | null
}

interface OrderStats {
  today_total: number
  month_total: number
  refund_count: number
}

const STATUS_CLS: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-slate-600 text-slate-400',
  refunded: 'bg-orange-500/20 text-orange-400',
}

const METHOD_LABELS: Record<string, string> = {
  linepay: '💚 LINE Pay',
  newebpay: '💳 藍新',
  stripe: '🔵 Stripe',
}

function formatNTD(n: number) {
  return `NT$${n.toLocaleString()}`
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [refunding, setRefunding] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/orders?page=${page}&status=${status}&method=${method}`)
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders ?? [])
        setTotal(d.total ?? 0)
        setStats(d.stats ?? null)
      })
      .finally(() => setLoading(false))
  }, [page, status, method])

  useEffect(() => { load() }, [load])

  async function refund(orderId: string) {
    const reason = prompt('請輸入退款原因：')
    if (!reason?.trim()) return
    setRefunding(orderId)
    try {
      const res = await fetch(`/api/super-admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' } : o))
      } else {
        const d = await res.json()
        alert(d.error || '退款失敗')
      }
    } finally {
      setRefunding(null)
    }
  }

  async function exportCsv() {
    const res = await fetch('/api/super-admin/orders/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">💳 金流訂單</h1>
        <button onClick={exportCsv} className="text-sm px-3 py-1.5 bg-slate-700 text-white/70 hover:bg-slate-600 rounded-lg transition-all">
          📥 匯出 CSV
        </button>
      </div>

      {/* 統計 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{formatNTD(stats.today_total)}</p>
            <p className="text-xs text-white/40 mt-1">今日營收</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{formatNTD(stats.month_total)}</p>
            <p className="text-xs text-white/40 mt-1">本月營收</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.refund_count}</p>
            <p className="text-xs text-white/40 mt-1">退款筆數</p>
          </div>
        </div>
      )}

      {/* 篩選 */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none">
          <option value="all">全部狀態</option>
          <option value="completed">已完成</option>
          <option value="pending">待付款</option>
          <option value="failed">失敗</option>
          <option value="refunded">已退款</option>
        </select>
        <select value={method} onChange={e => { setMethod(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none">
          <option value="all">全部方式</option>
          <option value="linepay">LINE Pay</option>
          <option value="newebpay">藍新</option>
          <option value="stripe">Stripe</option>
        </select>
      </div>

      {/* 表格 */}
      {loading ? (
        <p className="text-white/50 animate-pulse">載入訂單...</p>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">訂單號</th>
                <th className="text-left px-4 py-2">使用者</th>
                <th className="text-right px-4 py-2">金額</th>
                <th className="text-right px-4 py-2">Z幣</th>
                <th className="text-left px-4 py-2">方式</th>
                <th className="text-left px-4 py-2">狀態</th>
                <th className="text-left px-4 py-2">時間</th>
                <th className="text-left px-4 py-2">操作</th>
              </tr></thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-white/30 py-8">無訂單記錄</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-white/50">{o.merchant_order_no ?? o.id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5 text-white/60 text-xs font-mono">{o.user_id?.slice(0, 8) ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-white/80 font-medium">{formatNTD(o.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400">{o.zcoin_amount ?? '—'}</td>
                    <td className="px-4 py-2.5 text-white/60 text-xs">{METHOD_LABELS[o.payment_method] ?? o.payment_method}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLS[o.status] ?? 'bg-slate-700 text-slate-400'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{new Date(o.created_at).toLocaleDateString('zh-TW')}</td>
                    <td className="px-4 py-2.5">
                      {o.status === 'completed' && (
                        <button
                          disabled={refunding === o.id}
                          onClick={() => refund(o.id)}
                          className="text-xs text-orange-400 hover:underline disabled:opacity-50"
                        >
                          {refunding === o.id ? '…' : '退款'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30 hover:bg-slate-700">
            上一頁
          </button>
          <span className="text-sm text-white/40">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30 hover:bg-slate-700">
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}

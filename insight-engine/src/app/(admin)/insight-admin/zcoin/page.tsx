'use client'

import { useEffect, useState } from 'react'

interface WalletRow {
  id: string
  user_id: string | null
  line_user_id: string | null
  username: string | null
  balance: number
  total_earned: number
  total_spent: number
  created_at: string
}

interface ZcoinStats {
  totalWallets: number
  totalBalance: number
  totalEarned: number
  totalSpent: number
  wallets: WalletRow[]
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function ZcoinAdminPage() {
  const [stats, setStats] = useState<ZcoinStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/zcoin')
      .then(r => r.ok ? r.json() as Promise<ZcoinStats> : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 text-white/50 text-sm animate-pulse">載入中...</div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 text-white/40 text-sm">無法載入 Z幣資料</div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-white">🪙 Z幣管理</h1>

      {/* 總覽 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '錢包數', value: stats.totalWallets, color: 'text-cyan-300' },
          { label: '總餘額', value: stats.totalBalance, color: 'text-amber-300' },
          { label: '總賺取', value: stats.totalEarned, color: 'text-emerald-300' },
          { label: '總花費', value: stats.totalSpent, color: 'text-rose-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 說明 */}
      <div className="bg-amber-500/5 border border-amber-400/15 rounded-xl p-4 text-sm text-amber-200/60 space-y-1">
        <p className="font-medium text-amber-200/80">Z幣規則</p>
        <p>取得：完成問卷 +1 · 分享 +5 · 邀請 +10 · 連續登入 +2 · 里程碑 +50</p>
        <p>花費：解鎖模板 -10 · AI 使用 -20 · 裝飾 -5~-15 · 特殊主題 -30</p>
      </div>

      {/* 錢包列表 */}
      <div>
        <h2 className="text-sm font-medium text-white/60 mb-3">用戶錢包列表</h2>
        {stats.wallets.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">尚無錢包記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left border-b border-white/10">
                  <th className="pb-2 pr-4 font-normal">用戶</th>
                  <th className="pb-2 pr-4 font-normal text-right">餘額</th>
                  <th className="pb-2 pr-4 font-normal text-right">總賺</th>
                  <th className="pb-2 pr-4 font-normal text-right">總花</th>
                  <th className="pb-2 font-normal">建立日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.wallets.map((w) => (
                  <tr key={w.id} className="text-white/70">
                    <td className="py-2.5 pr-4">
                      <p className="text-white/80">{w.username ?? w.line_user_id ?? '匿名'}</p>
                      <p className="text-xs text-white/30 font-mono">{w.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-amber-300 font-medium">{w.balance}</td>
                    <td className="py-2.5 pr-4 text-right text-emerald-400">{w.total_earned}</td>
                    <td className="py-2.5 pr-4 text-right text-rose-400">{w.total_spent}</td>
                    <td className="py-2.5 text-white/40 text-xs">{formatDate(w.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

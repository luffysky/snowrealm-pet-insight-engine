'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  type: 'earn' | 'spend'
  reason: string
  createdAt: string
}

interface WalletData {
  balance: { balance: number; totalEarned: number; totalSpent: number } | null
  history: Transaction[]
}

const REASON_LABEL: Record<string, string> = {
  survey_complete: '完成問卷',
  share: '分享結果',
  invite: '邀請好友',
  daily_login: '每日登入',
  milestone: '里程碑獎勵',
  unlock_template: '解鎖模板',
  ai_usage: '使用 AI 功能',
  decoration: '購買裝飾',
  special_theme: '解鎖特殊主題',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData>({ balance: null, history: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/zcoin')
      .then(r => r.ok ? r.json() as Promise<WalletData> : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">載入中...</div>
      </div>
    )
  }

  const { balance, history } = data

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">← 首頁</Link>
          <Link href="/explore" className="text-sm text-white/50 hover:text-white transition-colors">🔍 探索問卷</Link>
        </div>
      </nav>
      <div className="px-4 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">🪙 我的 Z幣錢包</h1>

      {/* 餘額卡片 */}
      <div className="bg-gradient-to-br from-amber-600/20 to-amber-400/10 border border-amber-400/20 rounded-2xl p-6 mb-6 text-center">
        <p className="text-sm text-amber-200/60 mb-1">目前餘額</p>
        <p className="text-5xl font-bold text-amber-300">{balance?.balance ?? 0}</p>
        <p className="text-xs text-amber-200/40 mt-1">Z幣</p>
        <div className="flex justify-center gap-6 mt-4 text-xs text-amber-200/50">
          <span>累計賺取 {balance?.totalEarned ?? 0}</span>
          <span>累計花費 {balance?.totalSpent ?? 0}</span>
        </div>
      </div>

      {/* 如何賺取 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-white/70 mb-3">如何賺取 Z幣</p>
        <div className="space-y-2 text-sm">
          {[
            ['✅', '完成問卷', '+1'],
            ['📤', '分享結果', '+5'],
            ['🤝', '邀請好友', '+10'],
            ['📅', '每日登入', '+2'],
            ['🎉', '里程碑獎勵', '+50'],
          ].map(([emoji, label, amt]) => (
            <div key={label} className="flex items-center justify-between text-white/60">
              <span>{emoji} {label}</span>
              <span className="text-amber-300 font-medium">{amt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 交易記錄 */}
      <div>
        <p className="text-sm font-medium text-white/70 mb-3">交易記錄</p>
        {history.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">尚無交易記錄</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white/80">{REASON_LABEL[tx.reason] ?? tx.reason}</p>
                  <p className="text-xs text-white/30">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={`text-base font-semibold ${tx.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

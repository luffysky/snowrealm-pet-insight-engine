'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ===== 邀請連結元件 =====

interface ReferralInfo {
  code: string
  referralUrl: string
  info: {
    referredBy?: string
    referrerName?: string
    referrals: { username: string; status: string; createdAt: string }[]
  } | null
}

function ReferralSection({ onEarned }: { onEarned?: () => void }) {
  const [data, setData] = useState<ReferralInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.ok ? r.json() as Promise<ReferralInfo> : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCopy() {
    if (!data?.referralUrl) return
    try {
      await navigator.clipboard.writeText(data.referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 靜默失敗 */ }
  }

  if (loading) return <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
  if (!data) return null

  const successReferrals = data.info?.referrals.filter(r => r.status === 'completed').length ?? 0
  const pendingReferrals = data.info?.referrals.filter(r => r.status === 'pending').length ?? 0

  return (
    <div className="bg-white/5 border border-emerald-400/15 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">🤝 邀請好友賺 Z幣</p>
          <p className="text-xs text-white/40 mt-0.5">每成功邀請一位好友 +10 Z幣</p>
        </div>
        <div className="text-right text-xs text-white/30">
          <p>成功 {successReferrals} 位</p>
          {pendingReferrals > 0 && <p className="text-amber-400/60">待確認 {pendingReferrals}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 truncate font-mono">
          {data.referralUrl}
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
        >
          {copied ? '✅ 已複製' : '📋 複製'}
        </button>
      </div>
      {data.info?.referrerName && (
        <p className="text-xs text-white/30">由 {data.info.referrerName} 邀請加入</p>
      )}
    </div>
  )
}

// ===== 型別 =====

interface BalanceData {
  balance: number
  totalEarned: number
  totalSpent: number
}

interface DailyTask {
  id: string
  title: string
  description: string
  emoji: string
  reward: number
  maxCompletions: number
  completionsToday: number
  isCompleted: boolean
}

// ===== 廣告觀看 =====

interface AdQuota {
  canWatch: boolean
  todayCount: number
  limit: number
  reward: number
}

function AdWatchSection({ onEarned }: { onEarned: () => void }) {
  const [quota, setQuota] = useState<AdQuota | null>(null)
  const [watching, setWatching] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [toast, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ad-view')
      .then(r => r.ok ? r.json() as Promise<AdQuota> : null)
      .then(d => { if (d) setQuota(d) })
      .catch(() => {})
  }, [])

  const handleWatch = async () => {
    if (!quota?.canWatch || watching) return
    setWatching(true)
    setCountdown(3)
    const tick = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) {
          clearInterval(tick)
          return 0
        }
        return n - 1
      })
    }, 1000)
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch('/api/ad-view', { method: 'POST' })
      const data = await res.json() as { success?: boolean; earned?: number; error?: string }
      if (data.success) {
        setToastMsg(`🪙 +${data.earned} Z幣！`)
        setTimeout(() => setToastMsg(null), 2000)
        setQuota(prev => prev ? { ...prev, todayCount: prev.todayCount + 1, canWatch: prev.todayCount + 1 < prev.limit } : prev)
        onEarned()
      } else {
        setToastMsg(data.error ?? '獲取失敗')
        setTimeout(() => setToastMsg(null), 2000)
      }
    } catch {
      setToastMsg('網路錯誤')
      setTimeout(() => setToastMsg(null), 2000)
    } finally {
      setWatching(false)
    }
  }

  if (!quota) return null

  return (
    <div className="bg-white/5 border border-amber-400/15 rounded-xl p-4 space-y-3 relative overflow-hidden">
      {toast && (
        <div className="absolute top-2 right-3 text-xs font-semibold text-amber-300 animate-bounce">{toast}</div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">👁️ 觀看廣告賺 Z幣</p>
          <p className="text-xs text-white/40 mt-0.5">今日剩餘 {quota.limit - quota.todayCount}/{quota.limit} 次</p>
        </div>
        <button
          onClick={handleWatch}
          disabled={!quota.canWatch || watching}
          className="relative px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/20 border border-amber-400/30 text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[80px] text-center"
        >
          {watching ? (
            <span className="flex items-center gap-1 justify-center">
              <span className="w-4 h-4 border-2 border-amber-400/50 border-t-amber-300 rounded-full animate-spin" />
              {countdown > 0 ? `${countdown}s` : '...'}
            </span>
          ) : quota.canWatch ? `+${quota.reward} 觀看` : '已達上限'}
        </button>
      </div>
      {/* 進度條 */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400/40 rounded-full transition-all"
          style={{ width: `${(quota.todayCount / quota.limit) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ===== 充值方案 =====

interface RechargePackage {
  id: string
  zcoin: number
  ntd: number
  badge?: string
  badgeColor?: string
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: 'starter', zcoin: 150, ntd: 30 },
  { id: 'basic', zcoin: 500, ntd: 90, badge: '最划算', badgeColor: 'bg-emerald-500' },
  { id: 'popular', zcoin: 1750, ntd: 290, badge: '推薦', badgeColor: 'bg-amber-500' },
  { id: 'value', zcoin: 4500, ntd: 690, badge: '超值', badgeColor: 'bg-purple-500' },
]

// ===== 工具函式 =====

function calcPerCoin(ntd: number, zcoin: number): string {
  return (ntd / zcoin).toFixed(2)
}

// ===== 元件 =====

function BalanceCard({ balance }: { balance: BalanceData | null }) {
  return (
    <div className="bg-gradient-to-br from-amber-600/20 to-amber-400/10 border border-amber-400/20 rounded-2xl p-6 mb-6 text-center">
      <p className="text-sm text-amber-200/60 mb-1">目前 Z幣餘額</p>
      <p className="text-5xl font-bold text-amber-300">{balance?.balance ?? 0}</p>
      <p className="text-xs text-amber-200/40 mt-1">Z幣</p>
      <div className="flex justify-center gap-6 mt-4 text-xs text-amber-200/50">
        <span>累計賺取 {balance?.totalEarned ?? 0}</span>
        <span>累計花費 {balance?.totalSpent ?? 0}</span>
      </div>
      <Link
        href="/wallet"
        className="inline-block mt-3 text-xs text-amber-300/60 hover:text-amber-300 transition-colors underline underline-offset-2"
      >
        查看完整交易記錄 →
      </Link>
    </div>
  )
}

interface TaskItemProps {
  task: DailyTask
  onComplete: (taskId: string) => void
  completing: string | null
}

function TaskItem({ task, onComplete, completing }: TaskItemProps) {
  const remaining = task.maxCompletions - task.completionsToday
  const isCompleting = completing === task.id

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
        task.isCompleted
          ? 'bg-white/3 border-white/5 opacity-50'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{task.emoji}</span>
        <div>
          <p className={`text-sm font-medium ${task.isCompleted ? 'text-white/40 line-through' : 'text-white/80'}`}>
            {task.title}
          </p>
          <p className="text-xs text-white/30">{task.description}</p>
          {task.maxCompletions > 1 && (
            <p className="text-xs text-white/20 mt-0.5">
              今日 {task.completionsToday}/{task.maxCompletions}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-amber-300">+{task.reward}</span>
        {task.isCompleted ? (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
            完成
          </span>
        ) : (
          <button
            onClick={() => onComplete(task.id)}
            disabled={isCompleting || remaining <= 0}
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 rounded-full px-3 py-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? '...' : `領取 (${remaining})`}
          </button>
        )}
      </div>
    </div>
  )
}

function RechargeCard({ pkg }: { pkg: RechargePackage }) {
  const perCoin = calcPerCoin(pkg.ntd, pkg.zcoin)
  const href = `/api/payment/zcoin-recharge?amount=${pkg.zcoin}&package=${pkg.id}`

  return (
    <div className="relative bg-white/5 border border-white/10 hover:border-amber-400/30 rounded-xl p-4 transition-colors">
      {pkg.badge && (
        <span
          className={`absolute -top-2 right-3 text-xs text-white font-semibold px-2 py-0.5 rounded-full ${pkg.badgeColor ?? 'bg-amber-500'}`}
        >
          {pkg.badge}
        </span>
      )}
      <div className="text-center mb-3">
        <p className="text-3xl font-bold text-amber-300">{pkg.zcoin}</p>
        <p className="text-xs text-amber-200/40">Z幣</p>
      </div>
      <div className="text-center mb-3">
        <p className="text-xl font-semibold text-white">NT${pkg.ntd}</p>
        <p className="text-xs text-white/30">≈ NT${perCoin} / Z幣</p>
      </div>
      <a
        href={href}
        className="block w-full text-center text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg py-2 transition-colors"
      >
        購買
      </a>
    </div>
  )
}

// ===== 主頁面 =====

export default function ZcoinShopPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const fetchBalance = useCallback(() => {
    fetch('/api/zcoin')
      .then((r) => (r.ok ? (r.json() as Promise<{ balance: BalanceData }>) : null))
      .then((d) => {
        if (d?.balance) setBalance(d.balance)
      })
      .catch(() => {})
      .finally(() => setLoadingBalance(false))
  }, [])

  const fetchTasks = useCallback(() => {
    fetch('/api/zcoin/tasks')
      .then((r) => (r.ok ? (r.json() as Promise<{ tasks: DailyTask[] }>) : null))
      .then((d) => {
        if (d?.tasks) setTasks(d.tasks)
      })
      .catch(() => {})
      .finally(() => setLoadingTasks(false))
  }, [])

  useEffect(() => {
    fetchBalance()
    fetchTasks()
  }, [fetchBalance, fetchTasks])

  const handleCompleteTask = async (taskId: string) => {
    setCompleting(taskId)
    try {
      const res = await fetch('/api/zcoin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      const data = await res.json() as { success?: boolean; earned?: number; message?: string; error?: string }
      if (res.ok && data.success) {
        showToast(data.message ?? `+${data.earned} Z幣！`)
        fetchBalance()
        fetchTasks()
      } else {
        showToast(data.error ?? '操作失敗')
      }
    } catch {
      showToast('網路錯誤，請稍後再試')
    } finally {
      setCompleting(null)
    }
  }

  const completedCount = tasks.filter((t) => t.isCompleted).length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-900 font-medium text-sm px-4 py-2 rounded-full shadow-lg animate-bounce">
          {toast}
        </div>
      )}

      {/* Top nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← 首頁
          </Link>
          <span className="text-sm font-medium text-amber-300">🪙 Z幣商店</span>
          <Link href="/wallet" className="text-sm text-white/50 hover:text-white transition-colors">
            錢包
          </Link>
        </div>
      </nav>

      <div className="px-4 py-8 max-w-md mx-auto">
        {/* 餘額卡片 */}
        {loadingBalance ? (
          <div className="h-40 bg-white/5 rounded-2xl mb-6 animate-pulse" />
        ) : (
          <BalanceCard balance={balance} />
        )}

        {/* 每日任務 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white/70">每日任務</p>
            {!loadingTasks && tasks.length > 0 && (
              <span className="text-xs text-white/30">
                {completedCount}/{tasks.length} 完成
              </span>
            )}
          </div>

          {loadingTasks ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">請先登入以查看每日任務</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  completing={completing}
                />
              ))}
            </div>
          )}
        </section>

        {/* 觀看廣告 */}
        <section className="mb-8">
          <AdWatchSection onEarned={fetchBalance} />
        </section>

        {/* Z幣充值方案 */}
        <section className="mb-8">
          <p className="text-sm font-medium text-white/70 mb-3">充值 Z幣</p>
          <div className="grid grid-cols-2 gap-3">
            {RECHARGE_PACKAGES.map((pkg) => (
              <RechargeCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
          <p className="text-xs text-white/20 mt-3 text-center">
            購買即表示同意服務條款。Z幣僅限平台內使用，不可兌換現金。
          </p>
        </section>

        {/* 邀請好友 */}
        <section className="mb-8">
          <ReferralSection onEarned={fetchBalance} />
        </section>

        {/* 如何賺取 Z幣 */}
        <section>
          <p className="text-sm font-medium text-white/70 mb-3">如何賺取 Z幣</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              {[
                ['✅', '完成問卷', '+1'],
                ['📤', '分享結果', '+5'],
                ['🤝', '邀請好友', '+10'],
                ['📅', '每日登入', '+2'],
                ['👁️', '觀看廣告', '+2'],
                ['🎉', '里程碑獎勵', '+50'],
              ].map(([emoji, label, amt]) => (
                <div key={label} className="flex items-center justify-between text-white/60">
                  <span>
                    {emoji} {label}
                  </span>
                  <span className="text-amber-300 font-medium">{amt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

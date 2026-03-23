'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageItem {
  used: number
  limit: number
}

interface PlanFeatures {
  responses: number
  surveys: number
  admins: number
  aiDaily: number
  webhooks: number
  name: string
  price: number
}

interface PaymentRecord {
  id: string
  trade_no: string | null
  amount: number
  status: string
  created_at: string
}

interface SubscriptionData {
  plan: string
  planName: string
  status: string
  periodEnd: string | null
  platformPartner?: boolean
  usage: {
    responses: UsageItem
    surveys: UsageItem
    admins: UsageItem
    aiDaily: UsageItem
  }
  plans: Record<string, PlanFeatures>
  payments: PaymentRecord[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_ORDER = ['free', 'pro', 'business'] as const

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: 'bg-slate-600 text-slate-200',
  pro: 'bg-blue-600 text-blue-100',
  business: 'bg-purple-600 text-purple-100',
  enterprise: 'bg-amber-600 text-amber-100',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '使用中', color: 'text-emerald-400' },
  past_due: { label: '逾期', color: 'text-amber-400' },
  cancelled: { label: '已取消', color: 'text-red-400' },
  trialing: { label: '試用中', color: 'text-cyan-400' },
}

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  success: '成功',
  failed: '失敗',
  pending: '處理中',
}

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 490, yearly: 4900 },
  business: { monthly: 1290, yearly: 12900 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLimit(val: number): string {
  return val === -1 ? '無限' : String(val)
}

function usagePercent(used: number, limit: number): number {
  if (limit === -1) return 0
  if (limit === 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

function progressBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatPrice(n: number): string {
  return `NT$${n.toLocaleString()}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = usagePercent(used, limit)
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-sm text-slate-400 mb-3">{label}</p>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressBarColor(pct)}`}
          style={{ width: `${limit === -1 ? 0 : pct}%` }}
        />
      </div>
      <p className="text-sm text-white/80">
        已用 <span className="font-semibold text-white">{used}</span> / {formatLimit(limit)}
      </p>
    </div>
  )
}

function StatusBanner({ status }: { status: 'success' | 'failed' }) {
  const isSuccess = status === 'success'
  return (
    <div className={`rounded-xl px-5 py-4 mb-6 border ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
      <p className={`text-sm font-medium ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
        {isSuccess ? '付款成功！方案已升級。' : '付款失敗，請重試或聯繫客服。'}
      </p>
    </div>
  )
}

function UpgradeModal({
  targetPlan,
  planName,
  onClose,
  onSuccess,
}: {
  targetPlan: string
  planName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const prices = PLAN_PRICES[targetPlan] ?? { monthly: 0, yearly: 0 }
  const displayPrice = period === 'monthly' ? prices.monthly : prices.yearly

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('請輸入 Email')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, period, email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '建立付款失敗')
      }
      const data = await res.json()
      if (data.paymentUrl && formRef.current) {
        const form = formRef.current
        form.action = data.paymentUrl
        ;(form.querySelector('[name="MerchantID"]') as HTMLInputElement).value = data.MerchantID ?? ''
        ;(form.querySelector('[name="TradeInfo"]') as HTMLInputElement).value = data.TradeInfo ?? ''
        ;(form.querySelector('[name="TradeSha"]') as HTMLInputElement).value = data.TradeSha ?? ''
        ;(form.querySelector('[name="Version"]') as HTMLInputElement).value = data.Version ?? ''
        form.submit()
        return
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">升級至 {planName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">收據 Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">付款週期</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPeriod('monthly')}
              className={`rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                period === 'monthly'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              月繳 {formatPrice(prices.monthly)}/月
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                period === 'yearly'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              年繳 {formatPrice(prices.yearly)}/年
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-1">應付金額</p>
          <p className="text-2xl font-bold text-white">{formatPrice(displayPrice)}</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium cursor-pointer transition-colors"
        >
          {submitting ? '處理中…' : '確認付款'}
        </button>

        {/* Hidden form for NewebPay redirect */}
        <form ref={formRef} method="POST" className="hidden">
          <input type="hidden" name="MerchantID" />
          <input type="hidden" name="TradeInfo" />
          <input type="hidden" name="TradeSha" />
          <input type="hidden" name="Version" />
        </form>
      </div>
    </div>
  )
}

// ─── Feature rows for comparison table ────────────────────────────────────────

const FEATURE_ROWS: { key: keyof PlanFeatures; label: string }[] = [
  { key: 'responses', label: '每月回覆數' },
  { key: 'surveys', label: '問卷數' },
  { key: 'admins', label: '管理員人數' },
  { key: 'aiDaily', label: '每日 AI 用量' },
  { key: 'webhooks', label: 'Webhook' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

function SubscriptionPageInner() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [upgradeTarget, setUpgradeTarget] = useState<{ plan: string; name: string } | null>(null)

  const paymentStatus = searchParams.get('status') as 'success' | 'failed' | null

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/subscription')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = typeof json?.error === 'string' ? json.error : `HTTP ${res.status}`
        throw new Error(msg)
      }
      setData(json as SubscriptionData)
    } catch (e) {
      setError(e instanceof Error ? e.message : '無法載入訂閱資料')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubscription() }, [fetchSubscription])

  if (loading) return <p className="text-slate-400 animate-pulse">載入中…</p>
  if (error || !data) return <p className="text-red-400">{error || '資料載入失敗'}</p>

  const currentPlanIdx = PLAN_ORDER.indexOf(data.plan as typeof PLAN_ORDER[number])
  const statusInfo = STATUS_LABELS[data.status] ?? { label: data.status, color: 'text-slate-400' }

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-white">訂閱管理</h1>

      {paymentStatus && <StatusBanner status={paymentStatus} />}

      {data.platformPartner && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-sm text-amber-100/85">
          <span className="font-medium text-amber-200">🌟 平台禮遇（本帳號）</span>
          <p className="mt-1 text-amber-100/70">
            此頁方案名稱與用量上限已依禮遇身份顯示為<strong className="text-amber-200/90">無上限</strong>（僅你本人）；租戶實際訂閱方案不變，同組織其他人仍依原方案。使用平台 AI Key 時亦略過免費次數上限。
          </p>
        </div>
      )}

      {/* ─── Section 1: Current Plan ─── */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">目前方案</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE_COLORS[data.plan] ?? 'bg-slate-600 text-slate-200'}`}>
            {data.planName}
          </span>
          <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        {data.periodEnd && (
          <p className="text-sm text-slate-400">
            帳期至 <span className="text-white/80">{formatDate(data.periodEnd)}</span>
          </p>
        )}
      </section>

      {/* ─── Section 2: Usage Dashboard ─── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">使用量</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UsageCard label="本月回覆數" used={data.usage.responses.used} limit={data.usage.responses.limit} />
          <UsageCard label="問卷數" used={data.usage.surveys.used} limit={data.usage.surveys.limit} />
          <UsageCard label="管理員人數" used={data.usage.admins.used} limit={data.usage.admins.limit} />
          <UsageCard label="今日 AI 用量" used={data.usage.aiDaily.used} limit={data.usage.aiDaily.limit} />
        </div>
      </section>

      {/* ─── Section 3: Plan Comparison ─── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">方案比較</h2>
        <div className="overflow-x-auto">
          <PlanComparisonTable
            plans={data.plans}
            currentPlan={data.plan}
            currentPlanIdx={currentPlanIdx}
            onUpgrade={(plan, name) => setUpgradeTarget({ plan, name })}
          />
        </div>
      </section>

      {/* ─── Section 4: Payment History ─── */}
      {data.payments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">付款紀錄</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-400">
                    <th className="px-5 py-3 font-medium">日期</th>
                    <th className="px-5 py-3 font-medium">交易編號</th>
                    <th className="px-5 py-3 font-medium text-right">金額</th>
                    <th className="px-5 py-3 font-medium text-center">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 text-slate-300">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{p.trade_no ?? '—'}</td>
                      <td className="px-5 py-3 text-white text-right">{formatPrice(p.amount)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${PAYMENT_STATUS_BADGE[p.status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                          {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ─── Upgrade Modal ─── */}
      {upgradeTarget && (
        <UpgradeModal
          targetPlan={upgradeTarget.plan}
          planName={upgradeTarget.name}
          onClose={() => setUpgradeTarget(null)}
          onSuccess={() => {
            setUpgradeTarget(null)
            fetchSubscription()
          }}
        />
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<p className="text-slate-400 animate-pulse">載入中…</p>}>
      <SubscriptionPageInner />
    </Suspense>
  )
}

// ─── Plan Comparison Table ────────────────────────────────────────────────────

function PlanComparisonTable({
  plans,
  currentPlan,
  currentPlanIdx,
  onUpgrade,
}: {
  plans: Record<string, PlanFeatures>
  currentPlan: string
  currentPlanIdx: number
  onUpgrade: (plan: string, name: string) => void
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left px-5 py-4 text-slate-400 font-medium w-36" />
          {PLAN_ORDER.map((key) => {
            const p = plans[key]
            if (!p) return null
            const isCurrent = key === currentPlan
            return (
              <th key={key} className={`px-5 py-4 text-center ${isCurrent ? 'bg-white/5' : ''}`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-semibold">{p.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      目前方案
                    </span>
                  )}
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {/* Price row */}
        <tr className="border-b border-white/5">
          <td className="px-5 py-3 text-slate-400">月費</td>
          {PLAN_ORDER.map((key) => {
            const p = plans[key]
            if (!p) return null
            const isCurrent = key === currentPlan
            return (
              <td key={key} className={`px-5 py-3 text-center ${isCurrent ? 'bg-white/5' : ''}`}>
                <span className="text-white font-semibold">
                  {p.price === 0 ? 'NT$0' : `NT$${p.price.toLocaleString()}/月`}
                </span>
              </td>
            )
          })}
        </tr>
        {/* Yearly price row */}
        <tr className="border-b border-white/5">
          <td className="px-5 py-3 text-slate-400">年費</td>
          {PLAN_ORDER.map((key) => {
            const prices = PLAN_PRICES[key]
            const isCurrent = key === currentPlan
            return (
              <td key={key} className={`px-5 py-3 text-center ${isCurrent ? 'bg-white/5' : ''}`}>
                <span className="text-slate-300">
                  {!prices || prices.yearly === 0 ? '—' : `NT$${prices.yearly.toLocaleString()}/年`}
                </span>
              </td>
            )
          })}
        </tr>
        {/* Feature rows */}
        {FEATURE_ROWS.map((row) => (
          <tr key={row.key} className="border-b border-white/5">
            <td className="px-5 py-3 text-slate-400">{row.label}</td>
            {PLAN_ORDER.map((key) => {
              const p = plans[key]
              if (!p) return null
              const isCurrent = key === currentPlan
              const val = p[row.key]
              return (
                <td key={key} className={`px-5 py-3 text-center text-slate-300 ${isCurrent ? 'bg-white/5' : ''}`}>
                  {typeof val === 'number' ? formatLimit(val) : String(val)}
                </td>
              )
            })}
          </tr>
        ))}
        {/* Action row */}
        <tr>
          <td className="px-5 py-4" />
          {PLAN_ORDER.map((key, idx) => {
            const p = plans[key]
            if (!p) return null
            const isCurrent = key === currentPlan
            if (isCurrent) {
              return (
                <td key={key} className="px-5 py-4 text-center bg-white/5">
                  <span className="text-sm text-slate-500">目前方案</span>
                </td>
              )
            }
            const isHigher = idx > currentPlanIdx
            return (
              <td key={key} className="px-5 py-4 text-center">
                <button
                  onClick={() => onUpgrade(key, p.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    isHigher
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {isHigher ? '升級' : '降級'}
                </button>
              </td>
            )
          })}
        </tr>
      </tbody>
    </table>
  )
}

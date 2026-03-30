'use client'

import { useEffect, useState } from 'react'

interface TrialStatusResponse {
  status: string
  daysRemaining: number
  isExpired: boolean
  canAccessAI: boolean
  assets: { surveys: number; responses: number; tags: number }
}

interface PlanCard {
  key: string
  name: string
  price: number
  features: string[]
  highlight: boolean
}

const PLANS: PlanCard[] = [
  { key: 'free',     name: '免費版', price: 0,    features: ['1,000 筆回覆/月', '3 份問卷', '基本統計'],                           highlight: false },
  { key: 'pro',      name: '專業版', price: 490,  features: ['10,000 筆回覆/月', '無限問卷', 'AI 洞察報告', 'LINE Bot 整合'],       highlight: true  },
  { key: 'business', name: '商業版', price: 1290, features: ['50,000 筆回覆/月', '無限一切', 'AI 自動化', '優先客服'],              highlight: false },
]

export default function UpgradePage() {
  const [data, setData] = useState<TrialStatusResponse | null>(null)

  useEffect(() => {
    fetch('/api/admin/trial-status')
      .then(r => r.json())
      .then((d: TrialStatusResponse) => setData(d))
      .catch(() => null)
  }, [])

  const assets = data?.assets

  return (
    <div className="min-h-screen bg-white/50 text-[#3d3155] p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155] mb-2">AI 功能需要升級方案</h1>
        {data?.isExpired ? (
          <p className="text-red-400 text-sm">你的 30 天免費試用已結束</p>
        ) : (
          <p className="text-[#8a7ca8] text-sm">
            {data ? `試用期剩餘 ${data.daysRemaining} 天` : '載入中...'}
          </p>
        )}
      </div>

      {/* Accumulated assets */}
      {assets && (
        <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-5 mb-6">
          <p className="text-slate-300 text-sm mb-4 text-center">
            你已累積以下資產，升級後立即解鎖 AI 分析：
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{assets.surveys}</div>
              <div className="text-xs text-[#8a7ca8] mt-1">份問卷</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-400">{assets.responses}</div>
              <div className="text-xs text-[#8a7ca8] mt-1">筆回覆</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-400">{assets.tags}</div>
              <div className="text-xs text-[#8a7ca8] mt-1">個標籤</div>
            </div>
          </div>
        </div>
      )}

      {/* Blurred AI report preview */}
      <div className="relative mb-6 rounded-xl overflow-hidden border border-[#b8a9e8]/20">
        <div className="bg-white/50 p-5 blur-sm select-none pointer-events-none" aria-hidden>
          <div className="h-3 bg-[#b8a9e8]/15 rounded w-2/3 mb-3" />
          <div className="h-3 bg-[#b8a9e8]/15 rounded w-full mb-2" />
          <div className="h-3 bg-[#b8a9e8]/15 rounded w-5/6 mb-2" />
          <div className="h-3 bg-[#b8a9e8]/15 rounded w-3/4 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[#b8a9e8]/10 rounded" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="text-center px-4">
            <div className="text-2xl mb-1">🔍</div>
            <p className="text-[#3d3155] font-semibold text-sm">AI 洞察報告預覽</p>
            <p className="text-[#8a7ca8] text-xs mt-1">升級後解鎖完整報告</p>
          </div>
        </div>
      </div>

      {/* Pricing plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`rounded-xl border p-4 flex flex-col ${
              plan.highlight
                ? 'border-emerald-500/60 bg-emerald-900/20'
                : 'border-[#b8a9e8]/20 bg-white/30 backdrop-blur-sm'
            }`}
          >
            {plan.highlight && (
              <span className="text-xs font-semibold text-emerald-400 mb-2">推薦</span>
            )}
            <div className="font-bold text-[#3d3155] mb-1">{plan.name}</div>
            <div className="text-xl font-bold text-[#3d3155] mb-3">
              {plan.price === 0 ? 'NT$0' : `NT$${plan.price}`}
              {plan.price > 0 && <span className="text-xs font-normal text-[#8a7ca8]">/月</span>}
            </div>
            <ul className="space-y-1 text-xs text-[#8a7ca8] flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex gap-1.5 items-start">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="https://line.me/R/ti/p/@474iwlht"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          💬 聯絡我們升級
        </a>
        <p className="text-[#3d3155]/60 text-xs mt-3">透過 LINE 聯繫，通常 24 小時內回覆</p>
      </div>
    </div>
  )
}

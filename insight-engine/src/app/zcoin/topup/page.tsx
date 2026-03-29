'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassPanel, GlassButton, ZCoinBadge } from '@/components/ui/glass'
import { soundManager } from '@/lib/soundManager'

const PLANS = [
  { id: 'plan_100',  zcoin: 100,  price: 30,  discount: null,   popular: false },
  { id: 'plan_300',  zcoin: 300,  price: 79,  discount: '88折', popular: false },
  { id: 'plan_500',  zcoin: 500,  price: 119, discount: '79折', popular: true  },
  { id: 'plan_1000', zcoin: 1000, price: 199, discount: '66折', popular: false },
]

function TopupContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const cancelled = searchParams.get('cancelled')

  const [selectedPlan, setSelectedPlan] = useState('plan_500')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [isFirstTopup, setIsFirstTopup] = useState(false)

  useEffect(() => {
    soundManager.preload()
    fetch('/api/zcoin').then(r => r.json()).then(d => {
      setBalance(d.balance?.balance ?? 0)
      // has_first_topup 在 migration_phase52 後可用，預設 false = 首儲
      setIsFirstTopup(d.balance?.hasFirstTopup === false || d.balance?.hasFirstTopup == null)
    }).catch(() => {})
  }, [])

  const handleTopup = async () => {
    setLoading(true)
    soundManager.play('tap')
    try {
      const res = await fetch('/api/line-pay/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // 跳轉到 LINE Pay
      window.location.href = data.paymentUrl
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)!
  const bonus = isFirstTopup ? Math.floor(selectedPlanData.zcoin * 0.5) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1030] via-[#1e1540] to-[#1a1030] flex flex-col items-center justify-center px-4 py-8">

      {/* 招財佔位符（素材製作完成後替換） */}
      <div className="text-6xl mb-2 animate-bounce">🐹</div>
      <p className="text-white/40 text-xs mb-6">招財正在幫你看顧 Z 幣！</p>

      <h1 className="text-2xl font-bold text-white mb-1">儲值 Z 幣</h1>

      {balance !== null && (
        <div className="flex items-center gap-2 mb-6 text-white/60 text-sm">
          目前餘額：<ZCoinBadge amount={balance} size="sm" />
        </div>
      )}

      {isFirstTopup && (
        <GlassPanel depth="light" className="mb-4 px-4 py-2.5 flex items-center gap-2 border-yellow-400/30 bg-yellow-400/10">
          <span className="text-yellow-300 text-sm font-medium">🎉 首次儲值享 50% 加碼！</span>
        </GlassPanel>
      )}

      {error && (
        <GlassPanel depth="light" className="mb-4 px-4 py-2.5 border-red-400/30 bg-red-400/10">
          <p className="text-red-300 text-sm">
            {error === 'payment_failed' && '付款失敗，請重試'}
            {error === 'order_not_found' && '找不到訂單，請重新儲值'}
            {error === 'already_processed' && '訂單已處理'}
            {!['payment_failed','order_not_found','already_processed'].includes(error) && '發生錯誤，請重試'}
          </p>
        </GlassPanel>
      )}

      {cancelled && (
        <GlassPanel depth="light" className="mb-4 px-4 py-2.5 border-white/20">
          <p className="text-white/60 text-sm">已取消付款</p>
        </GlassPanel>
      )}

      {/* 方案選擇 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const planBonus = isFirstTopup ? Math.floor(plan.zcoin * 0.5) : 0
          return (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan.id); soundManager.play('select') }}
              className={[
                'relative rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-95',
                isSelected
                  ? 'bg-[#b8a9e8]/25 border-[#b8a9e8]/60 shadow-[0_0_16px_rgba(184,169,232,0.3)]'
                  : 'bg-white/8 border-white/20 hover:border-white/35',
              ].join(' ')}
            >
              {plan.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#b8a9e8] text-xs text-white px-2 py-0.5 rounded-full font-medium">
                  最划算
                </span>
              )}
              {plan.discount && (
                <span className="absolute top-2 right-2 bg-red-400/80 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {plan.discount}
                </span>
              )}
              <div className="text-yellow-300 font-bold text-lg">✦ {plan.zcoin}</div>
              {planBonus > 0 && (
                <div className="text-yellow-400/70 text-xs">+{planBonus} 加碼</div>
              )}
              <div className="text-white/60 text-sm mt-1">NT${plan.price}</div>
            </button>
          )
        })}
      </div>

      {/* 確認按鈕 */}
      <GlassButton
        variant="primary"
        size="lg"
        loading={loading}
        onClick={handleTopup}
        className="w-full max-w-sm"
      >
        {loading ? '跳轉中...' : `LINE Pay 付款 NT$${selectedPlanData.price}`}
      </GlassButton>

      {isFirstTopup && bonus > 0 && (
        <p className="text-yellow-300/70 text-xs mt-3 text-center">
          首儲加碼：實際到帳 ✦ {selectedPlanData.zcoin + bonus}
        </p>
      )}

      <p className="text-white/30 text-xs mt-6 text-center max-w-xs leading-relaxed">
        Z 幣為平台虛擬代幣，不可兌換法幣，不可轉移至平台外。
        購買前請詳閱使用條款。
      </p>
    </div>
  )
}

export default function TopupPage() {
  return (
    <Suspense>
      <TopupContent />
    </Suspense>
  )
}

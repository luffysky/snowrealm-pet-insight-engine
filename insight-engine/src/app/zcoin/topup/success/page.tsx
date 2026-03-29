'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GlassPanel, GlassButton, ZCoinBadge } from '@/components/ui/glass'
import { soundManager } from '@/lib/soundManager'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const zcoin = Number(searchParams.get('zcoin') ?? 0)
  const bonus = Number(searchParams.get('bonus') ?? 0)
  const isDuplicate = searchParams.get('duplicate') === '1'

  useEffect(() => {
    soundManager.preload().then(() => {
      if (!isDuplicate) soundManager.play('achievement')
    })
  }, [isDuplicate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1030] via-[#1e1540] to-[#1a1030] flex flex-col items-center justify-center px-4">

      {/* 金幣動畫（招財素材完成後替換） */}
      <div className="text-6xl mb-4 animate-bounce">🪙</div>

      <GlassPanel depth="medium" glow className="w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h1 className="text-xl font-bold text-white mb-2">
          {isDuplicate ? '訂單已完成' : '儲值成功！'}
        </h1>

        {zcoin > 0 && (
          <div className="flex flex-col items-center gap-1 my-4">
            <p className="text-white/60 text-sm">已到帳</p>
            <ZCoinBadge amount={zcoin} />
            {bonus > 0 && (
              <p className="text-yellow-400/70 text-xs">（含首儲加碼 ✦{bonus}）</p>
            )}
          </div>
        )}

        {bonus > 0 && (
          <GlassPanel depth="light" className="mb-4 px-3 py-2 border-yellow-400/20 bg-yellow-400/8">
            <p className="text-yellow-300 text-xs">✨ 已解鎖「招財 VIP」限定稱號！</p>
          </GlassPanel>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <GlassButton variant="primary" onClick={() => router.push('/zcoin/shop')} className="w-full">
            去商城消費
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => router.push('/')} className="w-full">
            回首頁
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  )
}

export default function TopupSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}

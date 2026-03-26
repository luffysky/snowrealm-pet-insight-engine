'use client'

import { useState } from 'react'

interface UnlockModalProps {
  onClose: () => void
  onUnlockZcoin: () => void
  onUnlockAd: () => void
  zcoinCost?: number
}

const COPY_VARIANTS = [
  '你已經看到一部分的你。真正有價值的，是那些你自己沒發現的地方。',
  '你以為你已經懂自己了。但真正讓關係卡住的，是你沒看見的那段。',
  '初步結果只告訴你像什麼。完整分析才告訴你怎麼變得更好。',
]

export function UnlockModal({
  onClose,
  onUnlockZcoin,
  onUnlockAd,
  zcoinCost = 15,
}: UnlockModalProps) {
  const [adPlaying, setAdPlaying] = useState(false)
  const copy = COPY_VARIANTS[Math.floor(Math.random() * COPY_VARIANTS.length)]

  function handleWatchAd() {
    setAdPlaying(true)
    // 模擬廣告播放（實際接廣告 SDK 時替換）
    setTimeout(() => {
      setAdPlaying(false)
      onUnlockAd()
    }, 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="space-y-2 text-center">
          <div className="text-4xl">🔓</div>
          <p className="text-white/70 text-sm leading-relaxed">{copy}</p>
        </div>

        <div className="space-y-3">
          {/* 看廣告 */}
          <button
            onClick={handleWatchAd}
            disabled={adPlaying}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left disabled:opacity-60"
          >
            <span className="text-xl">👁️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">看廣告解鎖這次</p>
              <p className="text-xs text-white/40">
                {adPlaying ? '廣告播放中...' : '觀看 30 秒廣告，免費解鎖'}
              </p>
            </div>
          </button>

          {/* Z 幣 */}
          <button
            onClick={onUnlockZcoin}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors text-left"
          >
            <span className="text-xl">🪙</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">使用 {zcoinCost} Z 幣</p>
              <p className="text-xs text-white/40">立即解鎖，支援完整 5 種風格</p>
            </div>
          </button>

          {/* 升級 */}
          <a
            href="/insight-admin"
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 transition-colors text-left"
          >
            <span className="text-xl">⭐</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">升級無限解鎖</p>
              <p className="text-xs text-white/40">Pro 方案 · 所有功能永久解鎖</p>
            </div>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1"
        >
          先不了
        </button>
      </div>
    </div>
  )
}

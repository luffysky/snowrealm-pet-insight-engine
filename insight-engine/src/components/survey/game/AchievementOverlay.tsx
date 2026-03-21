'use client'

import type { Achievement } from '@/hooks/useGameState'

interface AchievementOverlayProps {
  achievement: Achievement | null
  onDismiss: () => void
}

export function AchievementOverlay({ achievement, onDismiss }: AchievementOverlayProps) {
  if (!achievement) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[#0a0e1a]/85 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      <div
        className="text-center px-8 py-9 bg-linear-to-br from-[rgba(255,215,0,0.1)] to-[rgba(124,92,252,0.1)] border-[1.5px] border-[#ffd700] rounded-[20px] shadow-[0_0_60px_rgba(255,215,0,0.15)] max-w-xs game-achievement-enter"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3 animate-[float_2s_ease-in-out_infinite]">
          {achievement.icon}
        </div>
        <div className="text-[11px] text-[#ffd700] tracking-[3px] mb-1 uppercase font-medium">
          成 就 解 鎖
        </div>
        <div className="text-xl font-bold text-[#ffd700] mb-2">
          {achievement.name}
        </div>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          {achievement.desc}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="px-8 py-2.5 border-[1.5px] border-[#ffd700] bg-[rgba(255,215,0,0.1)] rounded-xl text-[#ffd700] text-sm font-bold hover:bg-[rgba(255,215,0,0.2)] transition-colors cursor-pointer"
        >
          繼續冒險 →
        </button>
      </div>
    </div>
  )
}

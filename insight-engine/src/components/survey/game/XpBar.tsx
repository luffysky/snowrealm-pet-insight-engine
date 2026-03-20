'use client'

interface XpBarProps {
  xp: number
  maxXp: number
  level: number
  playerTitle: string
  xpSparkle: boolean
}

export function XpBar({ xp, maxXp, level, playerTitle, xpSparkle }: XpBarProps) {
  const pct = Math.min(100, (xp / maxXp) * 100)

  return (
    <div className="mb-4 space-y-2">
      {/* 玩家資訊列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(255,180,50,0.3)]">
            🐾
          </div>
          <div>
            <p className="text-sm font-bold text-amber-100">冒險者</p>
            <p className="text-[11px] text-amber-400/70">{playerTitle}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-purple-500/80 to-amber-500/80 rounded-full text-[11px] font-bold tracking-wider text-white">
          LV {level}
        </span>
      </div>

      {/* XP 條 */}
      <div>
        <div className="flex justify-between text-[11px] text-amber-300/50 mb-1">
          <span>EXP</span>
          <span className="relative">
            {xp} / {maxXp}
            {xpSparkle && (
              <span className="absolute -top-4 right-0 text-amber-400 text-xs font-bold game-xp-sparkle">
                +15
              </span>
            )}
          </span>
        </div>
        <div className="h-2 bg-[#2a2a4a] rounded-sm border border-[#4a4a6a] overflow-hidden theme-game-progress-track">
          <div
            className="h-full bg-gradient-to-r from-purple-400 via-amber-400 to-orange-400 transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundSize: '200% 100%', animation: 'xpShimmer 2s ease infinite' }}
          />
        </div>
      </div>
    </div>
  )
}

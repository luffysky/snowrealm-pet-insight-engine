'use client'

import type { SurveyTheme } from '@/types'
import type { GameData } from '@/hooks/useThemeInteraction'
import { progressTrackClass, progressBarClass, stepTextClass } from '@/lib/themes'

interface Props {
  theme: SurveyTheme
  currentStep: number  // 1-based
  totalSteps: number
  game: GameData | null
}

/** 遊戲主題：XP bar + 等級 + 節點地圖 */
function GameProgress({ currentStep, totalSteps, game }: {
  currentStep: number; totalSteps: number; game: GameData
}) {
  const xpPct = Math.min(100, (game.xp / game.maxXp) * 100)

  // 節點地圖 (最多 15 個)
  const maxNodes = Math.min(totalSteps, 15)
  const step = totalSteps > maxNodes ? Math.floor(totalSteps / maxNodes) : 1
  const nodes: number[] = []
  for (let i = 0; i < totalSteps; i += step) nodes.push(i)
  if (nodes[nodes.length - 1] !== totalSteps - 1) nodes.push(totalSteps - 1)

  return (
    <div className="space-y-3">
      {/* 玩家資訊列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(255,180,50,0.3)]">
            🐾
          </div>
          <div>
            <p className="text-sm font-bold text-amber-100">冒險者</p>
            <p className="text-[11px] text-amber-400/70">{game.playerTitle}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-linear-to-r from-purple-500/80 to-amber-500/80 rounded-full text-[11px] font-bold tracking-wider text-white">
          LV {game.level}
        </span>
      </div>

      {/* XP 條 */}
      <div>
        <div className="flex justify-between text-[11px] text-amber-300/50 mb-1">
          <span>EXP</span>
          <span className="relative">
            {game.xp} / {game.maxXp}
            {game.xpSparkle && (
              <span className="absolute -top-4 right-0 text-amber-400 text-xs font-bold game-xp-sparkle">
                +15
              </span>
            )}
          </span>
        </div>
        <div className="h-2 bg-[#2a2a4a] rounded-sm border border-[#4a4a6a] overflow-hidden theme-game-progress-track">
          <div
            className="h-full bg-linear-to-r from-purple-400 via-amber-400 to-orange-400 transition-all duration-700 ease-out theme-game-progress-fill"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* 節點地圖 */}
      <div className="flex items-center justify-center gap-0 flex-wrap py-1">
        {nodes.map((nodeIdx, i) => {
          const isCompleted = currentStep - 1 > nodeIdx
          const isCurrent = currentStep - 1 === nodeIdx
          const isLast = i === nodes.length - 1

          return (
            <div key={nodeIdx} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-purple-500 border-2 border-purple-400 shadow-[0_0_12px_rgba(124,92,252,0.5)] text-white animate-pulse'
                    : isCompleted
                      ? 'bg-amber-500 border-2 border-amber-400 shadow-[0_0_8px_rgba(255,180,50,0.3)] text-white'
                      : 'bg-white/5 border-2 border-white/10 text-white/20'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              {!isLast && (
                <div className={`w-3 h-0.5 transition-colors duration-300 ${isCompleted ? 'bg-amber-500' : 'bg-white/8'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 主題風味標籤（進度條上方） */
function ThemeLabel({ theme, currentStep, totalSteps }: {
  theme: SurveyTheme; currentStep: number; totalSteps: number
}) {
  const pct = Math.round((currentStep / totalSteps) * 100)

  switch (theme) {
    case 'cyber':
      return (
        <div className="font-mono text-xs text-cyan-400/60 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>&gt; SCANNING NODE_{currentStep}...</span>
          <span className="ml-auto text-cyan-300/80 cyber-neon">{pct}%</span>
        </div>
      )
    case 'ancient': {
      const labels = ['序', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
      const num = currentStep <= 12 ? labels[currentStep] : String(currentStep)
      return (
        <p className="text-xs text-amber-400/50 tracking-[3px]">
          第{num}問 · 共{totalSteps}問
        </p>
      )
    }
    case 'sakura':
      return (
        <p className="text-xs text-pink-300/60">
          {'🌸'.repeat(Math.min(currentStep, 8))}{currentStep > 8 ? ` ×${currentStep}` : ''}
        </p>
      )
    case 'ocean':
      return (
        <p className="text-xs text-cyan-300/60">
          🫧 深度 {currentStep * 10}m / {totalSteps * 10}m
        </p>
      )
    case 'forest': {
      // 種子→芽→苗→樹
      const ratio = currentStep / totalSteps
      const icon = ratio < 0.25 ? '🌱' : ratio < 0.5 ? '🌿' : ratio < 0.75 ? '🌲' : '🌳'
      return (
        <p className="text-xs text-emerald-300/60">
          {icon} 生長中…
        </p>
      )
    }
    case 'candy':
      return (
        <p className="text-xs text-purple-300/60 font-bold">
          🍬 ×{currentStep}
        </p>
      )
    case 'noir':
      return null // noir 極簡，不加額外標籤
    default:
      return null
  }
}

/** 格式化步驟文字 */
function formatStep(theme: SurveyTheme, current: number, total: number): string {
  switch (theme) {
    case 'cyber':
      return `[${String(current).padStart(2, '0')}/${String(total).padStart(2, '0')}] SYNCED`
    case 'noir':
      return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
    default:
      return `${current} / ${total}`
  }
}

export function ThemeProgress({ theme, currentStep, totalSteps, game }: Props) {
  const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  if (theme === 'game' && game) {
    return <GameProgress currentStep={currentStep} totalSteps={totalSteps} game={game} />
  }

  return (
    <div className="space-y-2">
      <ThemeLabel theme={theme} currentStep={currentStep} totalSteps={totalSteps} />
      <div className={progressTrackClass[theme]}>
        <div
          className={progressBarClass[theme]}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={stepTextClass[theme]}>
        {formatStep(theme, currentStep, totalSteps)}
      </p>
    </div>
  )
}

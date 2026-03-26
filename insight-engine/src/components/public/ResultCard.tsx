'use client'

import type { ResultType } from '@/types'
import type { SurveyTheme } from '@/types'
import { questionTitleClass, stepTextClass } from '@/lib/themes'

interface ResultCardProps {
  result: ResultType
  theme: SurveyTheme
  /** 同類人數百分比（可選，顯示「和 X% 的人一樣」） */
  sameTypePercent?: number
  /** 分享按鈕點擊 */
  onShare?: () => void
}

/** 計算結果類型 key — 純函式，可在 client 端呼叫 */
export function calculateResultKey(
  scoringRules: Record<string, Record<string, string>>,
  answers: { questionKey: string; value: string | string[] | null }[]
): string | null {
  const scores: Record<string, number> = {}

  for (const ans of answers) {
    const ruleForQ = scoringRules[ans.questionKey]
    if (!ruleForQ || ans.value == null) continue
    const values = Array.isArray(ans.value) ? ans.value : [ans.value]
    for (const v of values) {
      const typeKey = ruleForQ[v]
      if (typeKey) scores[typeKey] = (scores[typeKey] ?? 0) + 1
    }
  }

  if (Object.keys(scores).length === 0) return null
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

const CARD_BG: Record<SurveyTheme, string> = {
  default: 'bg-indigo-500/10 border-indigo-400/20',
  game:    'bg-amber-500/10 border-amber-400/20',
  cyber:   'bg-cyan-500/10 border-cyan-400/20',
  ancient: 'bg-amber-800/10 border-amber-600/20',
  sakura:  'bg-pink-500/10 border-pink-400/20',
  ocean:   'bg-blue-500/10 border-blue-400/20',
  forest:  'bg-emerald-500/10 border-emerald-400/20',
  candy:   'bg-fuchsia-500/10 border-fuchsia-400/20',
  noir:    'bg-white/5 border-white/10',
}

const TRAIT_STYLE: Record<SurveyTheme, string> = {
  default: 'bg-indigo-500/15 text-indigo-200/80',
  game:    'bg-amber-500/15 text-amber-200/80',
  cyber:   'bg-cyan-500/15 text-cyan-200/80',
  ancient: 'bg-amber-700/15 text-amber-200/80',
  sakura:  'bg-pink-500/15 text-pink-200/80',
  ocean:   'bg-blue-500/15 text-blue-200/80',
  forest:  'bg-emerald-500/15 text-emerald-200/80',
  candy:   'bg-fuchsia-500/15 text-fuchsia-200/80',
  noir:    'bg-white/5 text-white/60',
}

export function ResultCard({ result, theme, sameTypePercent, onShare }: ResultCardProps) {
  const cardBg = CARD_BG[theme] ?? CARD_BG.default
  const traitStyle = TRAIT_STYLE[theme] ?? TRAIT_STYLE.default

  return (
    <div
      className={`rounded-2xl border p-6 space-y-4 text-center ${cardBg}`}
      style={{ animation: 'option-card-stagger 0.5s 0.1s both' }}
    >
      {/* 大 emoji */}
      <div
        className="text-6xl drop-shadow-lg"
        style={{ animation: 'emoji-pop 0.6s cubic-bezier(.36,1.4,.2,1) both' }}
      >
        {result.emoji}
      </div>

      {/* 結果類型名稱 */}
      <div className="space-y-1">
        <p className={`text-xs opacity-40 ${stepTextClass[theme]}`}>你的測驗結果</p>
        <h2 className={`text-2xl font-bold leading-snug ${questionTitleClass[theme]}`}>
          {result.name}
        </h2>
      </div>

      {/* 描述 */}
      <p className={`text-sm leading-relaxed max-w-xs mx-auto ${stepTextClass[theme]} opacity-75`}>
        {result.description}
      </p>

      {/* 特質標籤 */}
      {result.traits && result.traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {result.traits.map((trait: string, i: number) => (
            <span
              key={i}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${traitStyle}`}
            >
              {trait}
            </span>
          ))}
        </div>
      )}

      {/* 同類百分比 */}
      {sameTypePercent !== undefined && (
        <p className={`text-xs ${stepTextClass[theme]} opacity-40`}>
          和 <span className="font-semibold opacity-70">{sameTypePercent}%</span> 的填答者一樣是這個類型
        </p>
      )}

      {/* 分享按鈕 */}
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          className={`mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all
            border border-white/15 text-white/70 hover:text-white hover:border-white/30`}
        >
          💬 分享我的結果
        </button>
      )}
    </div>
  )
}

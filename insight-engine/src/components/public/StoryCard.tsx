'use client'

import type { StoryCardData } from '@/lib/storyCardEngine'

interface StoryCardProps {
  data: StoryCardData
  theme?: string
}

export function StoryCard({ data, theme }: StoryCardProps) {
  const accentColor = resolveAccentColor(theme)

  return (
    <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
      {/* 背景漸層裝飾 */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}40, transparent 60%)` }}
      />

      <div className="relative p-5 space-y-4">
        {/* 頂部：問卷名稱 + emoji */}
        <div className="text-center space-y-1">
          <div className="text-2xl">{resolveThemeEmoji(theme)}</div>
          <p className="text-xs text-white/40 font-medium tracking-wide uppercase">
            {data.surveyTitle}
          </p>
        </div>

        <div className="border-t border-white/8" />

        {/* 個人化事實區塊 */}
        {data.personalFacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/30 font-semibold tracking-wider uppercase">你的選擇</p>
            <ul className="space-y-1.5">
              {data.personalFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                  <span className="shrink-0 mt-0.5 text-[10px]" style={{ color: accentColor }}>▸</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 群體比較區塊 */}
        {data.groupComparisons.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/30 font-semibold tracking-wider uppercase">與大家比較</p>
            <ul className="space-y-1.5">
              {data.groupComparisons.map((comparison, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: `${accentColor}cc` }}>
                  <span className="shrink-0 mt-0.5">👥</span>
                  {comparison}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 引言區塊（shareableOneLiner 作為引言） */}
        {data.shareableOneLiner && (
          <div
            className="rounded-xl px-4 py-3 border text-center"
            style={{
              background: `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
          >
            <p className="text-xs text-white/80 italic leading-relaxed">
              「{data.shareableOneLiner}」
            </p>
          </div>
        )}

        <div className="border-t border-white/8" />

        {/* 底部品牌標記 */}
        <div className="text-center space-y-0.5">
          <p className="text-[10px] text-white/20 font-medium">SnowRealm Insight Engine</p>
          <p className="text-[9px] text-white/15">insight.snowrealm.pet</p>
        </div>
      </div>
    </div>
  )
}

function resolveAccentColor(theme?: string): string {
  const map: Record<string, string> = {
    game:    '#f59e0b',
    cyber:   '#06b6d4',
    ancient: '#d97706',
    sakura:  '#ec4899',
    ocean:   '#3b82f6',
    forest:  '#10b981',
    candy:   '#d946ef',
    noir:    '#94a3b8',
    default: '#818cf8',
  }
  return map[theme ?? 'default'] ?? map.default
}

function resolveThemeEmoji(theme?: string): string {
  const map: Record<string, string> = {
    game:    '🏆',
    cyber:   '🤖',
    ancient: '📜',
    sakura:  '🌸',
    ocean:   '🌊',
    forest:  '🌿',
    candy:   '🍬',
    noir:    '🎬',
    default: '✨',
  }
  return map[theme ?? 'default'] ?? map.default
}

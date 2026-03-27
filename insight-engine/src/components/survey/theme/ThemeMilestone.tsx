'use client'

import type { SurveyTheme } from '@/types'
import type { ThemeMilestone } from '@/hooks/useThemeInteraction'

interface Props {
  theme: SurveyTheme
  milestone: ThemeMilestone | null
  onDismiss: () => void
}

const overlayBg: Record<SurveyTheme, string> = {
  default: 'bg-slate-950/80',
  game: 'bg-[#0a0e1a]/85',
  cyber: 'bg-[#000a15]/90',
  ancient: 'bg-[#0a0800]/85',
  sakura: 'bg-[#1a0010]/80',
  ocean: 'bg-[#000810]/85',
  forest: 'bg-[#000a05]/85',
  candy: 'bg-[#0a0015]/80',
  noir: 'bg-black/92',
  sunset: 'bg-orange-950/85',
  neon: 'bg-purple-950/90',
  aurora: 'bg-teal-950/85',
  space: 'bg-blue-950/90',
  minimal: 'bg-white/95',
}

const cardStyle: Record<SurveyTheme, string> = {
  default: 'bg-linear-to-br from-slate-800/90 to-slate-900/90 border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.05)]',
  game: 'bg-linear-to-br from-[rgba(255,215,0,0.1)] to-[rgba(124,92,252,0.1)] border-[1.5px] border-[#ffd700] rounded-[20px] shadow-[0_0_60px_rgba(255,215,0,0.15)]',
  cyber: 'bg-[#0a0f1e]/95 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,200,255,0.2)] backdrop-blur-xl cyber-scanline',
  ancient: 'bg-[#1a1208]/95 border border-amber-700/40 rounded-lg shadow-[0_0_40px_rgba(180,130,60,0.15)]',
  sakura: 'bg-[#2a1020]/85 border border-pink-400/30 rounded-2xl shadow-[0_0_60px_rgba(255,150,200,0.15)] backdrop-blur-xl',
  ocean: 'bg-[#051525]/85 border border-cyan-400/30 rounded-2xl shadow-[0_0_60px_rgba(0,180,255,0.2)] backdrop-blur-xl',
  forest: 'bg-[#0a1a08]/85 border border-emerald-500/30 rounded-xl shadow-[0_0_40px_rgba(0,200,80,0.15)]',
  candy: 'bg-[#1a0a30]/85 border-2 border-purple-400/40 rounded-[24px] shadow-[0_0_60px_rgba(200,100,255,0.2)]',
  noir: 'bg-[#111]/98 border border-white/20 rounded-md shadow-[0_0_30px_rgba(255,255,255,0.03)]',
  sunset: 'bg-orange-950/90 border border-orange-500/30 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.15)] backdrop-blur-xl',
  neon: 'bg-purple-950/90 border border-fuchsia-500/40 rounded-2xl shadow-[0_0_50px_rgba(217,70,239,0.2)] backdrop-blur-xl',
  aurora: 'bg-teal-950/90 border border-teal-400/30 rounded-2xl shadow-[0_0_50px_rgba(20,184,166,0.15)] backdrop-blur-xl',
  space: 'bg-blue-950/90 border border-blue-500/30 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] backdrop-blur-xl',
  minimal: 'bg-white border border-gray-200 rounded-2xl shadow-xl',
}

const labelStyle: Record<SurveyTheme, string> = {
  default: 'text-xs text-white/50 tracking-[3px] uppercase',
  game: 'text-[11px] text-[#ffd700] tracking-[3px] uppercase font-medium',
  cyber: 'text-xs text-cyan-400 tracking-[4px] uppercase font-mono',
  ancient: 'text-sm text-amber-400/80 tracking-[5px]',
  sakura: 'text-sm text-pink-300/70 tracking-[3px]',
  ocean: 'text-sm text-cyan-300/70 tracking-[3px]',
  forest: 'text-sm text-emerald-300/70 tracking-[3px]',
  candy: 'text-sm text-purple-300 tracking-[2px] font-bold',
  noir: 'text-xs text-white/40 tracking-[5px] uppercase font-mono',
  sunset: 'text-sm text-orange-300/70 tracking-[3px]',
  neon: 'text-xs text-fuchsia-400 tracking-[4px] uppercase font-mono',
  aurora: 'text-sm text-teal-300/70 tracking-[3px]',
  space: 'text-sm text-blue-300/70 tracking-[3px] font-mono',
  minimal: 'text-xs text-gray-500 tracking-[3px] uppercase',
}

const labelText: Record<SurveyTheme, string> = {
  default: '🎉 里程碑',
  game: '🏆 成 就 解 鎖',
  cyber: '⚡ SYSTEM ALERT',
  ancient: '📜 章 節 印 記',
  sakura: '🌸 花 語',
  ocean: '🐚 深 海 發 現',
  forest: '🌿 林 間 相 遇',
  candy: '🎉 派 對 驚 喜',
  noir: '📋 EVIDENCE LOG',
  sunset: '🌇 黃 昏 時 刻',
  neon: '⚡ NEON EVENT',
  aurora: '🌌 極 光 顯 現',
  space: '🚀 MISSION LOG',
  minimal: '✓ 里程碑',
}

const nameStyle: Record<SurveyTheme, string> = {
  default: 'text-lg font-medium text-white',
  game: 'text-xl font-bold text-[#ffd700]',
  cyber: 'text-xl font-bold text-cyan-300',
  ancient: 'text-xl font-bold text-amber-200',
  sakura: 'text-xl font-medium text-pink-200',
  ocean: 'text-xl font-medium text-cyan-200',
  forest: 'text-xl font-medium text-emerald-200',
  candy: 'text-xl font-bold text-white',
  noir: 'text-lg font-mono text-white/90 tracking-wide',
  sunset: 'text-xl font-semibold text-orange-200',
  neon: 'text-xl font-bold text-fuchsia-200',
  aurora: 'text-xl font-medium text-teal-200',
  space: 'text-xl font-medium text-blue-200',
  minimal: 'text-lg font-semibold text-gray-800',
}

const descStyle: Record<SurveyTheme, string> = {
  default: 'text-sm text-white/50 leading-relaxed',
  game: 'text-sm text-white/50 leading-relaxed',
  cyber: 'text-sm text-cyan-200/50 font-mono leading-relaxed',
  ancient: 'text-sm text-amber-200/50 leading-relaxed',
  sakura: 'text-sm text-pink-200/50 leading-relaxed',
  ocean: 'text-sm text-blue-200/50 leading-relaxed',
  forest: 'text-sm text-emerald-200/50 leading-relaxed',
  candy: 'text-sm text-purple-200/60 leading-relaxed',
  noir: 'text-sm text-white/30 font-mono leading-relaxed',
  sunset: 'text-sm text-orange-200/50 leading-relaxed',
  neon: 'text-sm text-fuchsia-200/50 leading-relaxed',
  aurora: 'text-sm text-teal-200/50 leading-relaxed',
  space: 'text-sm text-blue-200/50 leading-relaxed',
  minimal: 'text-sm text-gray-600 leading-relaxed',
}

const btnStyle: Record<SurveyTheme, string> = {
  default: 'px-8 py-2.5 border border-white/20 rounded-xl text-white/70 text-sm hover:bg-white/5 transition-colors cursor-pointer',
  game: 'px-8 py-2.5 border-[1.5px] border-[#ffd700] bg-[rgba(255,215,0,0.1)] rounded-xl text-[#ffd700] text-sm font-bold hover:bg-[rgba(255,215,0,0.2)] transition-colors cursor-pointer',
  cyber: 'px-8 py-2.5 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm font-mono hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(0,200,255,0.15)] transition-all cursor-pointer',
  ancient: 'px-8 py-2.5 border border-amber-700/40 bg-amber-900/20 rounded-lg text-amber-200 text-sm hover:bg-amber-900/30 transition-colors cursor-pointer',
  sakura: 'px-8 py-2.5 border border-pink-400/30 rounded-xl text-pink-200 text-sm hover:bg-pink-500/10 transition-colors cursor-pointer',
  ocean: 'px-8 py-2.5 border border-cyan-400/30 rounded-xl text-cyan-200 text-sm hover:bg-cyan-500/10 transition-colors cursor-pointer',
  forest: 'px-8 py-2.5 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm hover:bg-emerald-500/10 transition-colors cursor-pointer',
  candy: 'px-8 py-2.5 bg-linear-to-r from-pink-500/30 to-purple-500/30 border border-purple-400/30 rounded-full text-white text-sm font-bold hover:from-pink-500/40 hover:to-purple-500/40 transition-all cursor-pointer',
  noir: 'px-8 py-2.5 border border-white/30 rounded text-white/70 text-sm font-mono hover:bg-white/5 transition-colors cursor-pointer',
  sunset: 'px-8 py-2.5 border border-orange-400/30 rounded-xl text-orange-200 text-sm hover:bg-orange-500/10 transition-colors cursor-pointer',
  neon: 'px-8 py-2.5 border border-fuchsia-500/40 rounded-xl text-fuchsia-200 text-sm font-mono hover:bg-fuchsia-500/10 transition-all cursor-pointer',
  aurora: 'px-8 py-2.5 border border-teal-400/30 rounded-xl text-teal-200 text-sm hover:bg-teal-500/10 transition-colors cursor-pointer',
  space: 'px-8 py-2.5 border border-blue-400/30 rounded-xl text-blue-200 text-sm hover:bg-blue-500/10 transition-colors cursor-pointer',
  minimal: 'px-8 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors cursor-pointer',
}

const dismissText: Record<SurveyTheme, string> = {
  default: '繼續 →',
  game: '繼續冒險 →',
  cyber: 'CONTINUE >',
  ancient: '繼續前行 →',
  sakura: '繼續漫步 →',
  ocean: '繼續潛行 →',
  forest: '繼續探索 →',
  candy: '好開心！→',
  noir: 'PROCEED >',
  sunset: '繼續旅程 →',
  neon: 'NEXT >',
  aurora: '繼續前行 →',
  space: 'CONTINUE >',
  minimal: '繼續 →',
}

export function ThemeMilestone({ theme, milestone, onDismiss }: Props) {
  if (!milestone) return null

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm ${overlayBg[theme]} animate-in fade-in duration-300`}
      onClick={onDismiss}
    >
      <div
        className={`text-center px-8 py-9 max-w-xs milestone-enter ${cardStyle[theme]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3 milestone-icon-bounce">
          {milestone.icon}
        </div>
        <div className={`mb-1 ${labelStyle[theme]}`}>
          {labelText[theme]}
        </div>
        <div className={`mb-2 ${nameStyle[theme]}`}>
          {milestone.title}
        </div>
        <p className={`mb-5 ${descStyle[theme]}`}>
          {milestone.desc}
        </p>
        <button type="button" onClick={onDismiss} className={btnStyle[theme]}>
          {dismissText[theme]}
        </button>
      </div>
    </div>
  )
}

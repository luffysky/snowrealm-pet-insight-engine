/** 問卷視覺主題系統 */

import type { SurveyTheme } from '@/types'
export type { SurveyTheme }

export const THEME_LIST: { value: SurveyTheme; label: string; icon: string; description: string }[] = [
  { value: 'default', label: '深空紫', icon: '🌌', description: '沉穩優雅的深色問卷風格' },
  { value: 'game', label: '遊戲冒險', icon: '🎮', description: 'RPG 冒險感，XP 成就解鎖' },
  { value: 'cyber', label: '未來科技', icon: '🔮', description: '液態玻璃、霓虹光暈' },
  { value: 'ancient', label: '古風水墨', icon: '🏯', description: '水墨山水、宣紙質感、古典韻味' },
  { value: 'sakura', label: '櫻花夢境', icon: '🌸', description: '粉色櫻花、花瓣飄落、夢幻浪漫' },
  { value: 'ocean', label: '深海探索', icon: '🌊', description: '深藍海洋、生物螢光、水波紋理' },
  { value: 'forest', label: '森林秘境', icon: '🌿', description: '翠綠森林、螢火蟲、大地色調' },
  { value: 'candy', label: '糖果派對', icon: '🍬', description: '繽紛粉彩、活潑彈跳、歡樂氛圍' },
  { value: 'noir', label: '暗黑極簡', icon: '🖤', description: '黑白對比、極簡俐落、高級質感' },
]

// === Shell (最外層背景) ===
export const shellClass: Record<SurveyTheme, string> = {
  default:
    'min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center px-4 py-8',
  game:
    'min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4 py-8 theme-game-bg',
  cyber:
    'min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 py-8 theme-cyber-bg',
  ancient:
    'min-h-screen bg-[#1a1510] flex items-center justify-center px-4 py-8 theme-ancient-bg',
  sakura:
    'min-h-screen bg-[#1a0f18] flex items-center justify-center px-4 py-8 theme-sakura-bg',
  ocean:
    'min-h-screen bg-[#060d1a] flex items-center justify-center px-4 py-8 theme-ocean-bg',
  forest:
    'min-h-screen bg-[#0a1208] flex items-center justify-center px-4 py-8 theme-forest-bg',
  candy:
    'min-h-screen bg-[#1a0e20] flex items-center justify-center px-4 py-8 theme-candy-bg',
  noir:
    'min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8 theme-noir-bg',
}

// === Card (問卷卡片) ===
export const cardClass: Record<SurveyTheme, string> = {
  default:
    'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/5',
  game:
    'theme-game-card rounded-2xl p-8',
  cyber:
    'theme-cyber-card rounded-3xl p-8',
  ancient:
    'theme-ancient-card rounded-2xl p-8',
  sakura:
    'theme-sakura-card rounded-3xl p-8',
  ocean:
    'theme-ocean-card rounded-3xl p-8',
  forest:
    'theme-forest-card rounded-2xl p-8',
  candy:
    'theme-candy-card rounded-[28px] p-8',
  noir:
    'theme-noir-card rounded-xl p-8',
}

// === Progress bar ===
export const progressTrackClass: Record<SurveyTheme, string> = {
  default: 'w-full h-1.5 bg-white/10 rounded-full overflow-hidden',
  game: 'w-full h-4 bg-[#2a2a4a] rounded-sm border-2 border-[#4a4a6a] overflow-hidden theme-game-progress-track',
  cyber: 'w-full h-2 bg-white/5 rounded-full overflow-hidden theme-cyber-progress-track',
  ancient: 'w-full h-1.5 bg-[#3a2a1a]/50 rounded-full overflow-hidden theme-ancient-progress-track',
  sakura: 'w-full h-1.5 bg-pink-900/20 rounded-full overflow-hidden',
  ocean: 'w-full h-2 bg-blue-950/50 rounded-full overflow-hidden theme-ocean-progress-track',
  forest: 'w-full h-1.5 bg-emerald-950/50 rounded-full overflow-hidden',
  candy: 'w-full h-3 bg-white/10 rounded-full overflow-hidden',
  noir: 'w-full h-px bg-white/20 overflow-hidden',
}

export const progressBarClass: Record<SurveyTheme, string> = {
  default: 'h-full bg-linear-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500 ease-out',
  game: 'h-full bg-linear-to-r from-yellow-400 via-amber-400 to-orange-500 transition-all duration-700 ease-out theme-game-progress-fill',
  cyber: 'h-full bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500 rounded-full transition-all duration-500 ease-out theme-cyber-progress-fill',
  ancient: 'h-full bg-linear-to-r from-amber-800 via-red-800 to-amber-700 rounded-full transition-all duration-700 ease-out theme-ancient-progress-fill',
  sakura: 'h-full bg-linear-to-r from-pink-400 via-rose-300 to-pink-400 rounded-full transition-all duration-500 ease-out',
  ocean: 'h-full bg-linear-to-r from-cyan-500 via-blue-400 to-teal-400 rounded-full transition-all duration-600 ease-out theme-ocean-progress-fill',
  forest: 'h-full bg-linear-to-r from-emerald-500 via-green-400 to-lime-400 rounded-full transition-all duration-500 ease-out',
  candy: 'h-full bg-linear-to-r from-pink-400 via-purple-400 to-cyan-400 rounded-full transition-all duration-500 ease-out theme-candy-progress-fill',
  noir: 'h-full bg-white transition-all duration-500 ease-out',
}

// === Option button (單選/多選) ===
export function optionClass(theme: SurveyTheme, isSelected: boolean, isDisabled = false): string {
  if (theme === 'game') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-lg transition-all duration-200 cursor-pointer theme-game-option-selected'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-lg opacity-40 cursor-not-allowed theme-game-option'
    return 'w-full text-left px-5 py-4 rounded-lg transition-all duration-200 cursor-pointer theme-game-option'
  }
  if (theme === 'cyber') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer theme-cyber-option-selected'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-2xl opacity-30 cursor-not-allowed theme-cyber-option'
    return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer theme-cyber-option'
  }
  if (theme === 'ancient') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer theme-ancient-option-selected'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-xl opacity-30 cursor-not-allowed theme-ancient-option'
    return 'w-full text-left px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer theme-ancient-option'
  }
  if (theme === 'sakura') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer bg-pink-500/15 border border-pink-400/50 text-pink-100 shadow-lg shadow-pink-500/10'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-2xl bg-white/3 border border-pink-900/10 text-pink-200/30 cursor-not-allowed'
    return 'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-pink-950/20 border-pink-400/15 text-pink-200/70 hover:bg-pink-500/10 hover:border-pink-400/30'
  }
  if (theme === 'ocean') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer theme-ocean-option-selected'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-2xl opacity-30 cursor-not-allowed theme-ocean-option'
    return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer theme-ocean-option'
  }
  if (theme === 'forest') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-xl transition-all duration-200 cursor-pointer bg-emerald-500/15 border border-emerald-400/50 text-emerald-100 shadow-lg shadow-emerald-500/10'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-xl bg-white/3 border border-emerald-900/10 text-emerald-200/30 cursor-not-allowed'
    return 'w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer bg-emerald-950/20 border-emerald-500/15 text-emerald-200/70 hover:bg-emerald-500/10 hover:border-emerald-400/30'
  }
  if (theme === 'candy') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer theme-candy-option-selected'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-2xl opacity-30 cursor-not-allowed theme-candy-option'
    return 'w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer theme-candy-option'
  }
  if (theme === 'noir') {
    if (isSelected) return 'w-full text-left px-5 py-4 rounded-lg transition-all duration-200 cursor-pointer bg-white/10 border border-white/50 text-white'
    if (isDisabled) return 'w-full text-left px-5 py-4 rounded-lg border border-white/5 text-white/20 cursor-not-allowed'
    return 'w-full text-left px-5 py-4 rounded-lg border transition-all duration-200 cursor-pointer bg-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
  }
  // default
  if (isSelected) return 'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-cyan-500/20 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/10'
  if (isDisabled) return 'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 bg-white/3 border-white/5 text-white/30 cursor-not-allowed'
  return 'w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
}

// === Question title ===
export const questionTitleClass: Record<SurveyTheme, string> = {
  default: 'text-xl font-medium text-white/90 leading-relaxed',
  game: 'text-xl font-bold text-amber-100 leading-relaxed theme-game-title',
  cyber: 'text-xl font-medium text-cyan-50 leading-relaxed theme-cyber-title',
  ancient: 'text-xl font-bold text-amber-100 leading-relaxed theme-ancient-title',
  sakura: 'text-xl font-medium text-pink-100 leading-relaxed',
  ocean: 'text-xl font-medium text-blue-100 leading-relaxed theme-ocean-title',
  forest: 'text-xl font-medium text-emerald-100 leading-relaxed',
  candy: 'text-xl font-bold text-white leading-relaxed',
  noir: 'text-xl font-light text-white/90 leading-relaxed tracking-wide',
}

// === Textarea ===
export const textareaClass: Record<SurveyTheme, string> = {
  default:
    'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none transition-colors',
  game:
    'w-full bg-[#1a1a3a]/80 border-2 border-[#4a4a6a] rounded-lg px-5 py-4 text-amber-100 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 resize-none transition-colors font-mono',
  cyber:
    'w-full bg-white/3 border border-cyan-500/20 rounded-2xl px-5 py-4 text-cyan-50 placeholder:text-cyan-200/20 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 resize-none transition-colors theme-cyber-input',
  ancient:
    'w-full bg-[#2a1f14]/60 border border-amber-900/40 rounded-xl px-5 py-4 text-amber-100 placeholder:text-amber-200/25 focus:outline-none focus:border-amber-700/60 focus:ring-1 focus:ring-amber-700/20 resize-none transition-colors theme-ancient-input',
  sakura:
    'w-full bg-pink-950/30 border border-pink-400/20 rounded-2xl px-5 py-4 text-pink-100 placeholder:text-pink-300/25 focus:outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 resize-none transition-colors',
  ocean:
    'w-full bg-blue-950/40 border border-blue-500/20 rounded-2xl px-5 py-4 text-blue-100 placeholder:text-blue-300/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none transition-colors',
  forest:
    'w-full bg-emerald-950/30 border border-emerald-600/20 rounded-xl px-5 py-4 text-emerald-100 placeholder:text-emerald-300/25 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 resize-none transition-colors',
  candy:
    'w-full bg-white/5 border-2 border-purple-400/20 rounded-2xl px-5 py-4 text-white placeholder:text-purple-300/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 resize-none transition-colors',
  noir:
    'w-full bg-transparent border border-white/20 rounded-lg px-5 py-4 text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/50 resize-none transition-colors font-mono',
}

// === Action button (下一題/提交) ===
export const actionBtnClass: Record<SurveyTheme, string> = {
  default:
    'px-6 py-2.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
  game:
    'px-6 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-[#1a1a2e] font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer theme-game-btn shadow-lg shadow-amber-500/30',
  cyber:
    'px-6 py-2.5 border border-cyan-400/40 text-cyan-300 rounded-xl hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer theme-cyber-btn',
  ancient:
    'px-6 py-2.5 bg-linear-to-r from-amber-900 to-red-900 text-amber-100 font-bold rounded-lg hover:from-amber-800 hover:to-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer theme-ancient-btn shadow-lg shadow-amber-900/30',
  sakura:
    'px-6 py-2.5 bg-pink-500/20 border border-pink-400/30 text-pink-200 rounded-2xl hover:bg-pink-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
  ocean:
    'px-6 py-2.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 rounded-xl hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
  forest:
    'px-6 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 rounded-xl hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer',
  candy:
    'px-6 py-2.5 bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full hover:from-pink-400 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-purple-500/25',
  noir:
    'px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer',
}

// === CTA button (開始問卷) ===
export const ctaBtnClass: Record<SurveyTheme, string> = {
  default:
    'inline-block px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all duration-200',
  game:
    'inline-block px-8 py-4 bg-linear-to-r from-amber-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.03] transition-all duration-200 theme-game-cta',
  cyber:
    'inline-block px-8 py-4 text-white font-medium rounded-2xl transition-all duration-300 hover:scale-[1.02] theme-cyber-cta',
  ancient:
    'inline-block px-8 py-4 bg-linear-to-r from-amber-900 via-red-900 to-amber-900 text-amber-100 font-bold rounded-xl shadow-lg shadow-amber-900/40 hover:shadow-amber-900/60 hover:scale-[1.02] transition-all duration-200 theme-ancient-cta',
  sakura:
    'inline-block px-8 py-4 bg-linear-to-r from-pink-500 to-rose-400 text-white font-medium rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all duration-200',
  ocean:
    'inline-block px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-200',
  forest:
    'inline-block px-8 py-4 bg-linear-to-r from-emerald-500 to-green-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-200',
  candy:
    'inline-block px-8 py-4 bg-linear-to-r from-pink-500 via-purple-500 to-cyan-400 text-white font-bold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.03] transition-all duration-200 theme-candy-cta',
  noir:
    'inline-block px-8 py-4 bg-white text-black font-medium rounded-lg shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.01] transition-all duration-200',
}

// === Step counter text ===
export const stepTextClass: Record<SurveyTheme, string> = {
  default: 'text-sm text-white/40',
  game: 'text-sm text-amber-300/60 font-mono',
  cyber: 'text-sm text-cyan-400/50 font-mono tracking-wider',
  ancient: 'text-sm text-amber-400/50 tracking-widest',
  sakura: 'text-sm text-pink-300/50',
  ocean: 'text-sm text-blue-300/50',
  forest: 'text-sm text-emerald-300/50',
  candy: 'text-sm text-purple-300/60 font-bold',
  noir: 'text-sm text-white/30 font-mono tracking-wider',
}

// === Checkbox icon ===
export function checkboxClass(theme: SurveyTheme, isSelected: boolean): string {
  if (theme === 'game') {
    return isSelected
      ? 'w-5 h-5 rounded-sm border-2 flex items-center justify-center text-xs bg-amber-400 border-amber-400 text-[#1a1a2e] transition-colors'
      : 'w-5 h-5 rounded-sm border-2 flex items-center justify-center text-xs border-[#4a4a6a] transition-colors'
  }
  if (theme === 'cyber') {
    return isSelected
      ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-cyan-400 border-cyan-400 text-slate-900 transition-colors'
      : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-cyan-500/30 transition-colors'
  }
  if (theme === 'ancient') {
    return isSelected
      ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-amber-700 border-amber-700 text-amber-100 transition-colors'
      : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-amber-800/40 transition-colors'
  }
  if (theme === 'sakura') {
    return isSelected
      ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-pink-400 border-pink-400 text-white transition-colors'
      : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-pink-400/30 transition-colors'
  }
  if (theme === 'ocean') {
    return isSelected
      ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-cyan-400 border-cyan-400 text-slate-900 transition-colors'
      : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-blue-400/30 transition-colors'
  }
  if (theme === 'forest') {
    return isSelected
      ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-emerald-400 border-emerald-400 text-slate-900 transition-colors'
      : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-emerald-500/30 transition-colors'
  }
  if (theme === 'candy') {
    return isSelected
      ? 'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs bg-purple-400 border-purple-400 text-white transition-colors'
      : 'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs border-purple-400/30 transition-colors'
  }
  if (theme === 'noir') {
    return isSelected
      ? 'w-5 h-5 rounded-sm border-2 flex items-center justify-center text-xs bg-white border-white text-black transition-colors'
      : 'w-5 h-5 rounded-sm border-2 flex items-center justify-center text-xs border-white/30 transition-colors'
  }
  return isSelected
    ? 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs bg-cyan-400 border-cyan-400 text-slate-900 transition-colors'
    : 'w-5 h-5 rounded border-2 flex items-center justify-center text-xs border-white/30 transition-colors'
}

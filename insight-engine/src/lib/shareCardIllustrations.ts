// 分享小卡插畫系統 — 根據問卷主題或行業選擇 Emoji 組合

const ILLUSTRATIONS: Record<string, string[]> = {
  // 預設
  default: ['📊', '✨', '💡'],

  // 行業
  pet:        ['🐾', '✨', '🌿'],
  restaurant: ['🍽️', '☕', '🌮'],
  ecommerce:  ['🛍️', '📦', '💳'],
  education:  ['📚', '🎓', '✏️'],
  saas:       ['💻', '⚡', '🚀'],
  health:     ['💚', '🏥', '🌱'],
  hr:         ['👥', '🤝', '💼'],

  // 問卷主題（對應 9 種 SurveyTheme）
  game:    ['🎮', '🏆', '⭐'],
  cyber:   ['🤖', '⚡', '🌐'],
  ancient: ['🏯', '🌸', '📜'],
  sakura:  ['🌸', '🎀', '💮'],
  ocean:   ['🌊', '🐠', '🐚'],
  forest:  ['🌲', '🍃', '🦊'],
  candy:   ['🍬', '🎨', '🌈'],
  noir:    ['🖤', '🌙', '✨'],
}

export function getIllustration(theme?: string, industry?: string): string[] {
  if (industry && ILLUSTRATIONS[industry]) return ILLUSTRATIONS[industry]
  if (theme && ILLUSTRATIONS[theme]) return ILLUSTRATIONS[theme]
  return ILLUSTRATIONS.default
}

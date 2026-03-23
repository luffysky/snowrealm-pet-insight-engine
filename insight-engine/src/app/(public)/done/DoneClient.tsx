'use client'

import { useEffect, useState, useMemo } from 'react'
import { ThemeProvider, useTheme } from '@/components/survey/ThemeContext'
import { SurveyShell, SurveyCard } from '@/components/survey'
import { questionTitleClass, stepTextClass } from '@/lib/themes'
import { analyzePersonality, type PersonalityResult } from '@/lib/personalityAnalyzer'
import type { SurveyTheme, ThemeIntensity, SurveyConfig } from '@/types'
import { MVP_SURVEY_SLUG } from '@/constants'
import { WaitlistForm } from './WaitlistForm'
import { ClickTrackLinks } from './ClickTrackLinks'
import { DownloadAnswers } from './DownloadAnswers'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

interface GameStats {
  level: number
  totalXp: number
  xp: number
  maxXp: number
  milestoneCount: number
  playerTitle: string
  totalSteps: number
  theme: SurveyTheme
}

export function DoneClient() {
  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)

  useEffect(() => {
    // 優先從 sessionStorage 取 slug（由 survey 頁面存入），fallback 到主問卷 API
    const savedSlug = sessionStorage.getItem('surveySlug')
    const slugPromise = savedSlug
      ? Promise.resolve(savedSlug)
      : fetch('/api/primary-survey').then(r => r.json() as Promise<{ slug: string }>).then(d => d.slug ?? MVP_SURVEY_SLUG)

    slugPromise.then(slug =>
      Promise.all([
        fetch(`/api/surveys/${slug}`).then(r => r.json() as Promise<SurveyConfig>),
        fetch(`/api/surveys/theme?slug=${slug}`).then(r => r.json() as Promise<ThemeSettings>),
      ])
    )
      .then(([surveyData, themeData]) => {
        setConfig(surveyData)
        setThemeSettings(themeData)
      })
      .catch(() => {})
  }, [])

  if (!config || !themeSettings) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <p className="text-white/50 animate-pulse">載入中...</p>
      </div>
    )
  }

  return (
    <ThemeProvider initialTheme={themeSettings.defaultTheme} intensityMap={themeSettings.themeIntensity}>
      <DoneContent config={config} />
    </ThemeProvider>
  )
}

/* ============================================================
   Per-Theme Done Page Configuration
   ============================================================ */

interface ThemeDoneConfig {
  /** 頂部裝飾 emoji */
  topDecor: string
  /** 結語標題 */
  closingTitle: string
  /** 結語文案 */
  closingText: string
  /** 結語裝飾 emoji 列 */
  decorEmojis: string[]
  /** Stats 區標題 */
  statsLabel: string
  /** Badge 區標題 */
  badgeLabel: string
  /** CTA 文案 */
  ctaText: string
  /** 額外容器 CSS class */
  wrapClass: string
  /** Avatar 容器的入場動畫 */
  avatarAnim: string
  /** 分隔線樣式 */
  dividerClass: string
}

const THEME_DONE: Record<SurveyTheme, ThemeDoneConfig> = {
  default: {
    topDecor: '🐾',
    closingTitle: '冒險結束',
    closingText: '感謝你完成這趟旅程！你的每一個回答，都讓我們更懂你。',
    decorEmojis: ['✨', '🌟', '💫'],
    statsLabel: '冒險數據',
    badgeLabel: '獲得徽章',
    ctaText: '留下你的 email，搶先加入封測名單',
    wrapClass: '',
    avatarAnim: 'emoji-pop 0.6s cubic-bezier(.36,1.4,.2,1) both',
    dividerClass: 'border-t border-white/5',
  },
  game: {
    topDecor: '⚔️',
    closingTitle: '🏰 任務完成！',
    closingText: '勇者，你已經通過了所有關卡！準備好迎接下一場冒險了嗎？',
    decorEmojis: ['🗡️', '🛡️', '🏆', '💰'],
    statsLabel: '⚔️ 戰鬥報告',
    badgeLabel: '🎖️ 戰利品',
    ctaText: '登記冒險者公會，搶先獲得封測資格',
    wrapClass: 'done-theme-game',
    avatarAnim: 'game-coin-spin 0.8s ease-in-out',
    dividerClass: 'border-t border-amber-500/15',
  },
  cyber: {
    topDecor: '🔮',
    closingTitle: '// SCAN COMPLETE',
    closingText: 'SYSTEM: 資料掃描完畢。你的數位檔案已建立。等待同步至主伺服器...',
    decorEmojis: ['💠', '🔷', '⚡', '📡'],
    statsLabel: '> 系統分析',
    badgeLabel: '🔓 已解鎖',
    ctaText: '輸入 email 接入下一次系統更新',
    wrapClass: 'done-theme-cyber',
    avatarAnim: 'cyber-scan 1.5s linear',
    dividerClass: 'border-t border-cyan-500/15',
  },
  ancient: {
    topDecor: '🏯',
    closingTitle: '卷末 · 旅程止步',
    closingText: '竹簡已錄，筆墨成書。願此間記憶，能長存於你與毛孩的歲月裡。',
    decorEmojis: ['📜', '🖌️', '🏮', '🎋'],
    statsLabel: '📜 功績簿',
    badgeLabel: '🏅 印鑑',
    ctaText: '留下飛鴿傳書地址，待新篇啟時通知',
    wrapClass: 'done-theme-ancient',
    avatarAnim: 'ancient-brush-reveal 0.6s ease-out',
    dividerClass: 'border-t border-amber-700/15',
  },
  sakura: {
    topDecor: '🌸',
    closingTitle: '花落知多少',
    closingText: '每一瓣花都帶著你的故事輕輕飄落，這些溫柔的瞬間會一直盛開。',
    decorEmojis: ['🌸', '🎀', '💕', '🌷'],
    statsLabel: '🌸 花語統計',
    badgeLabel: '🎀 花冠',
    ctaText: '留下你的 email，讓花信傳遞最新消息',
    wrapClass: 'done-theme-sakura',
    avatarAnim: 'sakura-petal-fall 1.5s ease-in-out',
    dividerClass: 'border-t border-pink-500/15',
  },
  ocean: {
    topDecor: '🌊',
    closingTitle: '航行結束',
    closingText: '深海的回聲帶著你的答案，隨潮汐流向我們。感謝你願意潛入這片海。',
    decorEmojis: ['🐚', '🐬', '🫧', '⚓'],
    statsLabel: '🧭 航海日誌',
    badgeLabel: '🐚 收藏寶物',
    ctaText: '留下你的座標，下次啟航時通知你',
    wrapClass: 'done-theme-ocean',
    avatarAnim: 'ocean-float 2.5s ease-in-out infinite',
    dividerClass: 'border-t border-blue-500/15',
  },
  forest: {
    topDecor: '🌿',
    closingTitle: '林間散步結束',
    closingText: '陽光穿過樹梢，照亮了你和毛孩的每一步足跡。這片森林記住了你。',
    decorEmojis: ['🍃', '🌲', '🦋', '🍄'],
    statsLabel: '🌿 森林紀錄',
    badgeLabel: '🍀 自然印記',
    ctaText: '留下 email，讓森林的訊息找到你',
    wrapClass: 'done-theme-forest',
    avatarAnim: 'forest-leaf-dance 2s ease-in-out',
    dividerClass: 'border-t border-emerald-500/15',
  },
  candy: {
    topDecor: '🍭',
    closingTitle: '甜蜜收場！',
    closingText: '你的回答像糖果一樣繽紛！每一顆都帶著甜甜的心意，謝謝你！',
    decorEmojis: ['🍬', '🧁', '🎉', '🌈'],
    statsLabel: '🍬 糖果計數',
    badgeLabel: '🎪 甜蜜收藏',
    ctaText: '留下 email，第一口嘗鮮機會給你！',
    wrapClass: 'done-theme-candy',
    avatarAnim: 'candy-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) infinite alternate',
    dividerClass: 'border-t border-fuchsia-500/15',
  },
  noir: {
    topDecor: '🎬',
    closingTitle: 'FIN.',
    closingText: '畫面漸暗，字幕升起。這段故事已經落幕，但下一幕正在等你。',
    decorEmojis: ['🎞️', '🖤', '🕯️', '🎭'],
    statsLabel: '— 幕後統計 —',
    badgeLabel: '— 演員表 —',
    ctaText: '留下聯絡方式，等待下一部上映',
    wrapClass: 'done-theme-noir',
    avatarAnim: 'noir-fade-in 0.5s ease-out',
    dividerClass: 'border-t border-white/8',
  },
}

function DoneContent({ config }: { config: SurveyConfig }) {
  const { theme } = useTheme()
  const [showAnswers, setShowAnswers] = useState(false)
  const tc = THEME_DONE[theme] ?? THEME_DONE.default

  // 讀 sessionStorage 遊戲狀態（useEffect 避免 hydration mismatch）
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [personality, setPersonality] = useState<PersonalityResult | null>(null)

  useEffect(() => {
    try {
      const gs = sessionStorage.getItem('gameStats')
      if (gs) setGameStats(JSON.parse(gs))
    } catch {}
    try {
      const ar = sessionStorage.getItem('surveyAnswerRecord')
      if (ar) setPersonality(analyzePersonality(JSON.parse(ar)))
    } catch {}
  }, [])

  const level = gameStats?.level ?? 1
  const totalXp = gameStats?.totalXp ?? 0
  const xp = gameStats?.xp ?? 0
  const maxXp = gameStats?.maxXp ?? 100
  const milestoneCount = gameStats?.milestoneCount ?? 0
  const playerTitle = gameStats?.playerTitle ?? '冒險新手'

  const allBadges = useMemo(() => {
    const base = personality?.badges ?? [{ icon: '🏆', label: '冒險完成者' }]
    if (milestoneCount >= 4 && !base.find(b => b.label === '全成就達成')) {
      return [...base, { icon: '👑', label: '全成就達成' }]
    }
    return base
  }, [personality, milestoneCount])

  return (
    <SurveyShell>
      <SurveyCard>
        <div className={`text-center space-y-6 ${tc.wrapClass}`}>
          {/* Decor emoji row */}
          <div className="flex justify-center gap-2 text-lg opacity-40">
            {tc.decorEmojis.map((e, i) => (
              <span key={i} className="option-emoji-float" style={{ animationDelay: `${i * 0.3}s` }}>{e}</span>
            ))}
          </div>

          {/* Hero: personality avatar + title */}
          {personality ? (
            <div className="space-y-3">
              <div className="text-6xl drop-shadow-lg" style={{ animation: tc.avatarAnim }}>
                {personality.avatar}
              </div>
              <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
                {personality.title}
              </h1>
              <p className={`text-sm leading-relaxed max-w-md mx-auto ${stepTextClass[theme]} opacity-70`}>
                {personality.description}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl" style={{ animation: tc.avatarAnim }}>{tc.topDecor}</div>
              <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
                {config.doneTitle}
              </h1>
              <p className={`text-sm leading-relaxed ${stepTextClass[theme]} opacity-70`}>
                {config.doneSubtitle}
              </p>
            </div>
          )}

          {/* Theme closing message */}
          <div className="space-y-1">
            <p className={`text-xs font-medium ${stepTextClass[theme]} opacity-50`}>{tc.closingTitle}</p>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${stepTextClass[theme]} opacity-40`}>{tc.closingText}</p>
          </div>

          {/* Divider */}
          <div className={tc.dividerClass} />

          {/* Waitlist — 放最上面讓使用者第一眼看到 */}
          <div className="space-y-3">
            <p className={`text-sm ${stepTextClass[theme]}`}>{tc.ctaText}</p>
            <WaitlistForm />
          </div>

          <ClickTrackLinks />

          {/* Stats Cards */}
          {gameStats && (
            <div className="space-y-2">
              <p className={`text-xs ${stepTextClass[theme]} opacity-40`}>{tc.statsLabel}</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm mx-auto">
                <StatCard label={statLabel(theme, 'level')} value={`LV.${level}`} icon={statIcon(theme, 'level')} theme={theme} />
                <StatCard label={statLabel(theme, 'xp')} value={`${totalXp} XP`} icon={statIcon(theme, 'xp')} theme={theme} />
                <StatCard label={statLabel(theme, 'achieve')} value={`${milestoneCount}`} icon={statIcon(theme, 'achieve')} theme={theme} />
              </div>
            </div>
          )}

          {/* XP Progress Bar */}
          {gameStats && (
            <div className="max-w-sm mx-auto space-y-1">
              <div className={`flex justify-between text-[10px] ${stepTextClass[theme]} opacity-30`}>
                <span>{playerTitle}</span>
                <span>{xp}/{maxXp} XP</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden border ${xpBarBg(theme)}`}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((xp / maxXp) * 100, 100)}%`,
                    background: xpBarGradient(theme),
                  }}
                />
              </div>
            </div>
          )}

          {/* Badges */}
          {allBadges.length > 0 && (
            <div className="space-y-2">
              <p className={`text-xs ${stepTextClass[theme]} opacity-40`}>{tc.badgeLabel}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allBadges.map((b, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${badgeStyle(theme)}`}
                    style={{ animation: `option-card-stagger 0.4s ${i * 0.1}s both` }}
                  >
                    <span>{b.icon}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Answers */}
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className={`text-xs transition-colors cursor-pointer ${stepTextClass[theme]} opacity-30 hover:opacity-50`}
          >
            {showAnswers ? '▲ 收起回答紀錄' : '▼ 查看我的回答紀錄'}
          </button>

          {showAnswers && <DownloadAnswers />}

          {/* Platform CTA */}
          <div className={tc.dividerClass} />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/4 to-white/2 backdrop-blur-sm p-5 space-y-3">
            <div className="absolute inset-0 bg-linear-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
            <div className="relative space-y-3 text-center">
              <p className="text-sm font-semibold text-white/70">🚀 喜歡這份問卷體驗嗎？</p>
              <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                這份問卷由 <span className="text-white/60 font-medium">SnowRealm Insight Engine</span> 驅動 —
                企業級問卷平台，9 種沈浸式主題、AI 智慧出題、自動分流、CRM 標籤引擎，幫你用最短時間收集最有價值的洞察。
              </p>
              <a
                href="/register"
                className="inline-block px-5 py-2.5 rounded-full text-xs font-medium bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all"
              >
                免費建立我的問卷 →
              </a>
              <p className="text-[10px] text-white/25">3 分鐘上線，不需寫任何程式</p>
            </div>
          </div>
        </div>
      </SurveyCard>
    </SurveyShell>
  )
}

/* ============================================================
   Per-Theme Stat / Badge Helpers
   ============================================================ */

function StatCard({ label, value, icon, theme }: { label: string; value: string; icon: string; theme: SurveyTheme }) {
  return (
    <div className={`rounded-xl p-3 border text-center space-y-1 ${statCardStyle(theme)}`}>
      <div className="text-lg">{icon}</div>
      <div className={`text-base font-bold ${questionTitleClass[theme]}`}>{value}</div>
      <div className={`text-[10px] ${stepTextClass[theme]} opacity-40`}>{label}</div>
    </div>
  )
}

function statIcon(theme: SurveyTheme, type: 'level' | 'xp' | 'achieve'): string {
  const map: Record<SurveyTheme, Record<string, string>> = {
    default: { level: '⚔️', xp: '✨', achieve: '🏅' },
    game:    { level: '⚔️', xp: '💰', achieve: '🏆' },
    cyber:   { level: '📊', xp: '⚡', achieve: '🔓' },
    ancient: { level: '📜', xp: '🖌️', achieve: '🏮' },
    sakura:  { level: '🌸', xp: '💕', achieve: '🎀' },
    ocean:   { level: '⚓', xp: '🫧', achieve: '🐚' },
    forest:  { level: '🌲', xp: '🍃', achieve: '🦋' },
    candy:   { level: '🍭', xp: '🌈', achieve: '🧁' },
    noir:    { level: '🎬', xp: '🎞️', achieve: '🕯️' },
  }
  return map[theme]?.[type] ?? map.default[type]
}

function statLabel(theme: SurveyTheme, type: 'level' | 'xp' | 'achieve'): string {
  const map: Record<SurveyTheme, Record<string, string>> = {
    default: { level: '等級', xp: '總經驗', achieve: '成就' },
    game:    { level: '勇者等級', xp: '金幣', achieve: '戰利品' },
    cyber:   { level: 'RANK', xp: 'POWER', achieve: 'UNLOCK' },
    ancient: { level: '品階', xp: '修為', achieve: '功勳' },
    sakura:  { level: '花期', xp: '花瓣', achieve: '花環' },
    ocean:   { level: '深度', xp: '浪花', achieve: '寶物' },
    forest:  { level: '年輪', xp: '生命力', achieve: '印記' },
    candy:   { level: '甜度', xp: '糖果', achieve: '收藏' },
    noir:    { level: '場景', xp: '膠卷', achieve: '獎項' },
  }
  return map[theme]?.[type] ?? map.default[type]
}

function statCardStyle(theme: SurveyTheme): string {
  const map: Record<SurveyTheme, string> = {
    default: 'bg-indigo-500/5 border-indigo-500/10',
    game: 'bg-amber-500/5 border-amber-500/10',
    cyber: 'bg-cyan-500/5 border-cyan-500/10',
    ancient: 'bg-amber-800/5 border-amber-700/10',
    sakura: 'bg-pink-500/5 border-pink-500/10',
    ocean: 'bg-blue-500/5 border-blue-500/10',
    forest: 'bg-emerald-500/5 border-emerald-500/10',
    candy: 'bg-fuchsia-500/5 border-fuchsia-500/10',
    noir: 'bg-white/3 border-white/8',
  }
  return map[theme] ?? map.default
}

function badgeStyle(theme: SurveyTheme): string {
  const map: Record<SurveyTheme, string> = {
    default: 'bg-white/5 border border-white/10 text-white/70',
    game: 'bg-amber-500/10 border border-amber-500/20 text-amber-200/80',
    cyber: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-200/80',
    ancient: 'bg-amber-800/10 border border-amber-700/20 text-amber-200/80',
    sakura: 'bg-pink-500/10 border border-pink-400/20 text-pink-200/80',
    ocean: 'bg-blue-500/10 border border-blue-400/20 text-blue-200/80',
    forest: 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-200/80',
    candy: 'bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-200/80',
    noir: 'bg-white/5 border border-white/10 text-white/60',
  }
  return map[theme] ?? map.default
}

function xpBarBg(theme: SurveyTheme): string {
  const map: Record<SurveyTheme, string> = {
    default: 'bg-slate-800/80 border-white/5',
    game: 'bg-amber-950/50 border-amber-500/10',
    cyber: 'bg-cyan-950/50 border-cyan-500/10',
    ancient: 'bg-amber-950/40 border-amber-700/10',
    sakura: 'bg-pink-950/50 border-pink-500/10',
    ocean: 'bg-blue-950/50 border-blue-500/10',
    forest: 'bg-emerald-950/50 border-emerald-500/10',
    candy: 'bg-fuchsia-950/50 border-fuchsia-500/10',
    noir: 'bg-slate-900/80 border-white/5',
  }
  return map[theme] ?? map.default
}

function xpBarGradient(theme: SurveyTheme): string {
  const map: Record<SurveyTheme, string> = {
    default: 'linear-gradient(90deg, #6366f1, #a78bfa)',
    game: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    cyber: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
    ancient: 'linear-gradient(90deg, #92400e, #d97706)',
    sakura: 'linear-gradient(90deg, #ec4899, #f9a8d4)',
    ocean: 'linear-gradient(90deg, #2563eb, #60a5fa)',
    forest: 'linear-gradient(90deg, #059669, #34d399)',
    candy: 'linear-gradient(90deg, #d946ef, #f0abfc)',
    noir: 'linear-gradient(90deg, #94a3b8, #e2e8f0)',
  }
  return map[theme] ?? map.default
}

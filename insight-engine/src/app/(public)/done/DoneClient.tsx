'use client'

import { useEffect, useState, useMemo } from 'react'
import { ThemeProvider, useTheme } from '@/components/survey/ThemeContext'
import { SurveyShell, SurveyCard } from '@/components/survey'
import { questionTitleClass, stepTextClass } from '@/lib/themes'
import { analyzePersonality, type PersonalityResult } from '@/lib/personalityAnalyzer'
import type { SurveyTheme, ThemeIntensity, SurveyConfig, ResultType } from '@/types'
import { ResultCard, calculateResultKey } from '@/components/public/ResultCard'
import type { StoryCardData } from '@/lib/storyCardEngine'
import { WaitlistForm } from './WaitlistForm'
import { ClickTrackLinks } from './ClickTrackLinks'
import { DownloadAnswers } from './DownloadAnswers'
import { StoryCard } from '@/components/public/StoryCard'
import { ShareButtons } from '@/components/public/ShareButtons'

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
    // 從 sessionStorage 取 slug（由 survey 頁面存入），若無則顯示通用完成頁
    const savedSlug = sessionStorage.getItem('surveySlug')
    if (!savedSlug) {
      // 無問卷 slug → 通用感謝頁面，不載入任何問卷特定內容
      setConfig({
        slug: '',
        title: '感謝填寫',
        subtitle: '',
        coverTitle: '',
        coverSubtitle: '',
        startButtonText: '',
        doneTitle: '感謝你的參與！',
        doneSubtitle: '你的回覆已成功送出 💛',
        questions: [],
      })
      setThemeSettings({
        defaultTheme: 'default',
        availableThemes: ['default'],
        allowUserChoice: false,
        themeIntensity: {} as Record<SurveyTheme, ThemeIntensity>,
      })
      return
    }

    Promise.all([
      fetch(`/api/surveys/${savedSlug}`).then(r => r.json() as Promise<SurveyConfig>),
      fetch(`/api/surveys/theme?slug=${savedSlug}`).then(r => r.json() as Promise<ThemeSettings>),
    ])
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
  sunset: {
    topDecor: '🌇',
    closingTitle: '夕陽無限好',
    closingText: '暮色低垂，感謝你在黃昏時刻留下足跡，我們期待與你再次相遇。',
    decorEmojis: ['🌅', '🔥', '✨', '🌇'],
    statsLabel: '— 夕陽數據 —',
    badgeLabel: '— 暮光成就 —',
    ctaText: '留下聯絡，迎接下一個黎明',
    wrapClass: 'done-theme-sunset',
    avatarAnim: 'fade-slide-up 0.5s ease-out',
    dividerClass: 'border-t border-orange-500/20',
  },
  neon: {
    topDecor: '🌃',
    closingTitle: 'GAME OVER',
    closingText: '霓虹熄滅，但故事仍在繼續。感謝你點亮這座城市的數據夜空。',
    decorEmojis: ['⚡', '🔮', '💜', '🌃'],
    statsLabel: '— 夜城數據 —',
    badgeLabel: '— 霓虹成就 —',
    ctaText: '輸入代號，解鎖下一個副本',
    wrapClass: 'done-theme-neon',
    avatarAnim: 'fade-slide-up 0.5s ease-out',
    dividerClass: 'border-t border-fuchsia-500/20',
  },
  aurora: {
    topDecor: '🌌',
    closingTitle: '極光閉幕',
    closingText: '極光漸漸退去，感謝你在冰雪世界留下溫暖的足跡。',
    decorEmojis: ['🌌', '❄️', '💚', '🌿'],
    statsLabel: '— 極光數據 —',
    badgeLabel: '— 冰原成就 —',
    ctaText: '留下聯絡，等待下一道極光',
    wrapClass: 'done-theme-aurora',
    avatarAnim: 'fade-slide-up 0.5s ease-out',
    dividerClass: 'border-t border-teal-500/20',
  },
  space: {
    topDecor: '🚀',
    closingTitle: '返航地球',
    closingText: '探索任務完成，感謝你在星際旅途中留下珍貴的觀測數據。',
    decorEmojis: ['🚀', '⭐', '🪐', '🌌'],
    statsLabel: '— 星際數據 —',
    badgeLabel: '— 太空成就 —',
    ctaText: '留下信號，期待下次相遇',
    wrapClass: 'done-theme-space',
    avatarAnim: 'fade-slide-up 0.5s ease-out',
    dividerClass: 'border-t border-blue-500/20',
  },
  minimal: {
    topDecor: '✓',
    closingTitle: '完成',
    closingText: '感謝您撥冗填寫，您的意見對我們非常寶貴。',
    decorEmojis: ['✓', '○', '□', '△'],
    statsLabel: '統計數據',
    badgeLabel: '個人成就',
    ctaText: '留下聯絡方式',
    wrapClass: 'done-theme-minimal',
    avatarAnim: 'fade-slide-up 0.3s ease-out',
    dividerClass: 'border-t border-gray-200',
  },
}

function DoneContent({ config }: { config: SurveyConfig }) {
  const { theme } = useTheme()
  const [showAnswers, setShowAnswers] = useState(false)
  const tc = THEME_DONE[theme] ?? THEME_DONE.default

  // 讀 sessionStorage 遊戲狀態（useEffect 避免 hydration mismatch）
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [personality, setPersonality] = useState<PersonalityResult | null>(null)
  const [resultType, setResultType] = useState<ResultType | null>(null)

  // Z幣任務狀態
  const [zcoinEarned] = useState(1) // 完成問卷固定 +1
  const [taskProgress, setTaskProgress] = useState<{ completed: number; total: number } | null>(null)

  // 故事卡片狀態
  const [responseId, setResponseId] = useState<string | null>(null)
  const [storyCard, setStoryCard] = useState<StoryCardData | null>(null)
  const [storyCardLoading, setStoryCardLoading] = useState(false)
  const [allowStoryWall, setAllowStoryWall] = useState(false)
  const [storyWallUpdating, setStoryWallUpdating] = useState(false)

  useEffect(() => {
    try {
      const gs = sessionStorage.getItem('gameStats')
      if (gs) setGameStats(JSON.parse(gs))
    } catch {}
    try {
      const ar = sessionStorage.getItem('surveyAnswerRecord')
      if (ar) {
        const record = JSON.parse(ar)
        setPersonality(analyzePersonality(record))
        // 如果問卷有 resultConfig → 用 scoringRules 計算真實結果類型
        if (config?.resultConfig) {
          const answers = (record as { questionKey: string; answer: unknown }[]).map(r => ({
            questionKey: r.questionKey,
            value: r.answer as string | string[] | null,
          }))
          const key = calculateResultKey(config.resultConfig.scoringRules, answers)
          if (key) {
            const found = config.resultConfig.resultTypes.find(rt => rt.key === key)
            if (found) setResultType(found)
          }
        }
      }
    } catch {}

    // 載入今日任務進度
    fetch('/api/zcoin/tasks')
      .then(r => r.ok ? r.json() as Promise<{ tasks: { isCompleted: boolean }[] }> : null)
      .then(d => {
        if (d?.tasks) {
          setTaskProgress({ completed: d.tasks.filter(t => t.isCompleted).length, total: d.tasks.length })
        }
      })
      .catch(() => {})

    const rid = sessionStorage.getItem('lastResponseId')
    if (rid) {
      setResponseId(rid)
      setStoryCardLoading(true)
      fetch(`/api/story-card/${rid}`)
        .then(r => r.ok ? r.json() as Promise<StoryCardData> : null)
        .then(card => { if (card) setStoryCard(card) })
        .catch(() => {})
        .finally(() => setStoryCardLoading(false))
    }
  }, [])

  async function handleAllowStoryWallChange(checked: boolean) {
    if (!responseId || storyWallUpdating) return
    setStoryWallUpdating(true)
    try {
      await fetch(`/api/story-card/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowStoryWall: checked }),
      })
      setAllowStoryWall(checked)
    } catch {
      // 靜默失敗，不影響使用者體驗
    } finally {
      setStoryWallUpdating(false)
    }
  }

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

          {/* 結果類型卡片（人格/測驗問卷專用） */}
          {resultType && (
            <ResultCard
              result={resultType}
              theme={theme}
              onShare={() => {
                if (typeof window === 'undefined') return
                const url = window.location.origin + '/done'
                const text = `我在${config.title}中測出：${resultType.emoji} ${resultType.name}`
                window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
              }}
            />
          )}

          {/* Hero: personality avatar + title — 當沒有 resultConfig 時才顯示 */}
          {!resultType && personality ? (
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
          ) : !resultType ? (
            <div className="space-y-3">
              <div className="text-5xl" style={{ animation: tc.avatarAnim }}>{tc.topDecor}</div>
              <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
                {config.doneTitle}
              </h1>
              <p className={`text-sm leading-relaxed ${stepTextClass[theme]} opacity-70`}>
                {config.doneSubtitle}
              </p>
            </div>
          ) : null}

          {/* Theme closing message */}
          <div className="space-y-1">
            <p className={`text-xs font-medium ${stepTextClass[theme]} opacity-50`}>{tc.closingTitle}</p>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${stepTextClass[theme]} opacity-40`}>{tc.closingText}</p>
          </div>

          {/* Divider */}
          <div className={tc.dividerClass} />

          {/* Waitlist — 僅在 doneConfig.showWaitlist 開啟時顯示 */}
          {(config.doneConfig?.showWaitlist ?? false) && (
            <div className="space-y-3">
              <p className={`text-sm ${stepTextClass[theme]}`}>{tc.ctaText}</p>
              <WaitlistForm />
            </div>
          )}

          <ClickTrackLinks />

          {/* Story Card 區塊 */}
          {(storyCardLoading || storyCard) && (
            <div className="space-y-3">
              <div className={tc.dividerClass} />
              {storyCardLoading && (
                <p className={`text-xs text-center ${stepTextClass[theme]} opacity-40 animate-pulse`}>
                  🎉 你的故事卡片生成中...
                </p>
              )}
              {!storyCardLoading && storyCard && (
                <div className="space-y-3">
                  <StoryCard data={storyCard} theme={theme} />
                  <ShareButtons
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/story/${storyCard.responseId}`}
                    title={`${storyCard.surveyTitle} — 我的故事卡片`}
                  />
                  {/* 匿名分享到故事牆 */}
                  <label className="flex items-center gap-2 justify-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allowStoryWall}
                      disabled={storyWallUpdating}
                      onChange={e => handleAllowStoryWallChange(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-indigo-400 cursor-pointer disabled:opacity-50"
                    />
                    <span className={`text-xs ${stepTextClass[theme]} opacity-40 group-hover:opacity-60 transition-opacity select-none`}>
                      我願意匿名分享我的故事到故事牆
                    </span>
                    {storyWallUpdating && <span className="text-xs opacity-30">...</span>}
                  </label>
                </div>
              )}
            </div>
          )}

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

          {/* Z幣獎勵 */}
          <div className={tc.dividerClass} />
          <div className="rounded-2xl border border-amber-400/20 bg-linear-to-br from-amber-600/10 to-amber-400/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <div>
                  <p className="text-sm font-semibold text-amber-200">完成問卷獲得 +{zcoinEarned} Z幣</p>
                  {taskProgress && (
                    <p className="text-xs text-amber-200/50 mt-0.5">
                      今日任務：{taskProgress.completed}/{taskProgress.total} 完成
                    </p>
                  )}
                </div>
              </div>
              <a
                href="/zcoin-shop"
                className="text-xs px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-300 hover:bg-amber-400/10 transition-colors"
              >
                查看任務 →
              </a>
            </div>
            {taskProgress && (
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400/50 rounded-full transition-all duration-700"
                  style={{ width: `${taskProgress.total > 0 ? (taskProgress.completed / taskProgress.total) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

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
    sunset:  { level: '🌅', xp: '🔥', achieve: '🌇' },
    neon:    { level: '⚡', xp: '💜', achieve: '🌃' },
    aurora:  { level: '🌌', xp: '❄️', achieve: '💚' },
    space:   { level: '🚀', xp: '⭐', achieve: '🪐' },
    minimal: { level: '○', xp: '□', achieve: '△' },
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
    sunset:  { level: '時刻', xp: '溫度', achieve: '光芒' },
    neon:    { level: 'LEVEL', xp: 'ENERGY', achieve: 'UNLOCK' },
    aurora:  { level: '極光', xp: '冰晶', achieve: '奇蹟' },
    space:   { level: '星級', xp: '燃料', achieve: '勛章' },
    minimal: { level: '等級', xp: '經驗', achieve: '成就' },
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
    sunset: 'bg-orange-500/5 border-orange-500/10',
    neon: 'bg-fuchsia-500/5 border-fuchsia-500/10',
    aurora: 'bg-teal-500/5 border-teal-500/10',
    space: 'bg-blue-500/5 border-blue-500/10',
    minimal: 'bg-gray-100 border-gray-200',
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
    sunset: 'bg-orange-500/10 border border-orange-400/20 text-orange-200/80',
    neon: 'bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-200/80',
    aurora: 'bg-teal-500/10 border border-teal-400/20 text-teal-200/80',
    space: 'bg-blue-500/10 border border-blue-400/20 text-blue-200/80',
    minimal: 'bg-gray-100 border border-gray-300 text-gray-700',
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
    sunset: 'bg-orange-950/50 border-orange-500/10',
    neon: 'bg-fuchsia-950/50 border-fuchsia-500/10',
    aurora: 'bg-teal-950/50 border-teal-500/10',
    space: 'bg-blue-950/50 border-blue-500/10',
    minimal: 'bg-gray-200 border-gray-300',
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
    sunset: 'linear-gradient(90deg, #ea580c, #f97316)',
    neon: 'linear-gradient(90deg, #d946ef, #22d3ee)',
    aurora: 'linear-gradient(90deg, #14b8a6, #34d399)',
    space: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    minimal: 'linear-gradient(90deg, #374151, #6b7280)',
  }
  return map[theme] ?? map.default
}

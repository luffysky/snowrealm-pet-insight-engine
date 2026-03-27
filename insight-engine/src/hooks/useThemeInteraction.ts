'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { SurveyTheme } from '@/types'

export interface ThemeMilestone {
  icon: string
  title: string
  desc: string
}

export interface GameData {
  xp: number
  maxXp: number
  level: number
  playerTitle: string
  xpSparkle: boolean
}

const GAME_TITLES = ['見習毛友', '初階毛友', '中階毛友', '資深毛友', '毛行達人']

const MILESTONES: Record<SurveyTheme, { at: number; m: ThemeMilestone }[]> = {
  default: [
    { at: 0.25, m: { icon: '✨', title: '持續前進', desc: '已完成四分之一！' } },
    { at: 0.50, m: { icon: '🌟', title: '過半了', desc: '已完成一半的旅程！' } },
    { at: 0.75, m: { icon: '💫', title: '即將完成', desc: '只剩最後幾題了！' } },
    { at: 1.00, m: { icon: '🎉', title: '完成！', desc: '感謝你的填寫！' } },
  ],
  game: [
    { at: 0.25, m: { icon: '🐾', title: '初心踏步', desc: '完成了四分之一的冒險旅程！' } },
    { at: 0.50, m: { icon: '📸', title: '記憶收集者', desc: '已經走過一半的旅途！' } },
    { at: 0.75, m: { icon: '🗺️', title: '探險家之心', desc: '即將抵達旅途終點！' } },
    { at: 1.00, m: { icon: '⭐', title: '冒險達人', desc: '成功完成整段冒險！' } },
  ],
  cyber: [
    { at: 0.25, m: { icon: '📡', title: 'SIGNAL LOCKED', desc: '數據鏈路已建立 — 掃描進度 25%' } },
    { at: 0.50, m: { icon: '🔓', title: 'ACCESS GRANTED', desc: '核心資料庫已解鎖 — 同步進度 50%' } },
    { at: 0.75, m: { icon: '⚡', title: 'OVERCLOCKED', desc: '效能已提昇至極限 — 完成度 75%' } },
    { at: 1.00, m: { icon: '🌐', title: 'FULLY SYNCED', desc: '全域數據鏈路同步完成' } },
  ],
  ancient: [
    { at: 0.25, m: { icon: '🏮', title: '踏入山門', desc: '行至四分之一，山色漸明' } },
    { at: 0.50, m: { icon: '🎋', title: '竹林深處', desc: '半途已過，心境愈清' } },
    { at: 0.75, m: { icon: '🏯', title: '登堂入室', desc: '將至終途，大道在前' } },
    { at: 1.00, m: { icon: '🌟', title: '得道圓滿', desc: '全卷已畢，功德圓滿' } },
  ],
  sakura: [
    { at: 0.25, m: { icon: '🌱', title: '初綻', desc: '第一片花瓣悄然綻放…' } },
    { at: 0.50, m: { icon: '🌸', title: '半開', desc: '櫻花已開至半盛' } },
    { at: 0.75, m: { icon: '💮', title: '盛放', desc: '花雨紛飛，美不勝收' } },
    { at: 1.00, m: { icon: '🎐', title: '花見圓滿', desc: '一期一會，感謝相遇' } },
  ],
  ocean: [
    { at: 0.25, m: { icon: '🐚', title: '淺海探索', desc: '發現了一枚美麗的貝殼' } },
    { at: 0.50, m: { icon: '🐠', title: '珊瑚礁邂逅', desc: '在珊瑚礁中發現了熱帶魚群' } },
    { at: 0.75, m: { icon: '🐋', title: '深海巨靈', desc: '與深海鯨魚有了一次邂逅' } },
    { at: 1.00, m: { icon: '🔱', title: '海洋之心', desc: '完成了深海探索的全部旅程' } },
  ],
  forest: [
    { at: 0.25, m: { icon: '🌱', title: '種子萌芽', desc: '偵測到生命的第一抹綠意' } },
    { at: 0.50, m: { icon: '🦊', title: '林間訪客', desc: '一隻好奇的狐狸前來探望' } },
    { at: 0.75, m: { icon: '🦌', title: '鹿群守護', desc: '森林的守護者向你致敬' } },
    { at: 1.00, m: { icon: '🌳', title: '古木見證', desc: '千年古木見證了你的足跡' } },
  ],
  candy: [
    { at: 0.25, m: { icon: '🍭', title: '甜蜜開場', desc: '收集了第一批糖果！' } },
    { at: 0.50, m: { icon: '🧁', title: '半糖時刻', desc: '甜蜜度已達 50%！' } },
    { at: 0.75, m: { icon: '🎂', title: '派對升級', desc: '糖果派對即將達到高潮！' } },
    { at: 1.00, m: { icon: '🎪', title: '完美派對', desc: '最甜蜜的派對圓滿結束！' } },
  ],
  noir: [
    { at: 0.25, m: { icon: '🔍', title: 'CASE OPENED', desc: '初步線索已收集' } },
    { at: 0.50, m: { icon: '📋', title: 'HALFWAY MARK', desc: '調查進度過半' } },
    { at: 0.75, m: { icon: '🗝️', title: 'KEY EVIDENCE', desc: '關鍵證據到手' } },
    { at: 1.00, m: { icon: '📁', title: 'CASE CLOSED', desc: '調查完畢，檔案歸檔' } },
  ],
  sunset: [
    { at: 0.25, m: { icon: '🌅', title: '黃昏時分', desc: '已完成四分之一，夕陽初升！' } },
    { at: 0.50, m: { icon: '🌇', title: '暮色漸深', desc: '已走過一半旅程，餘暉正美！' } },
    { at: 0.75, m: { icon: '🔥', title: '夕陽無限', desc: '即將到達終點，燃燒到最後！' } },
    { at: 1.00, m: { icon: '🌙', title: '夜幕降臨', desc: '感謝你在黃昏留下足跡！' } },
  ],
  neon: [
    { at: 0.25, m: { icon: '💡', title: 'NEON SPARK', desc: '霓虹初亮，進度 25%！' } },
    { at: 0.50, m: { icon: '⚡', title: 'CHARGED UP', desc: '能量蓄積過半，繼續發光！' } },
    { at: 0.75, m: { icon: '🌃', title: 'CITY BLAZING', desc: '都市之夜全力燃燒，75% 完成！' } },
    { at: 1.00, m: { icon: '🎆', title: 'NEON GLORY', desc: '霓虹盛放，感謝點亮這一刻！' } },
  ],
  aurora: [
    { at: 0.25, m: { icon: '🌿', title: '極光初現', desc: '天際出現第一道極光帷幕！' } },
    { at: 0.50, m: { icon: '🌌', title: '星空共舞', desc: '極光與星河共舞，旅程過半！' } },
    { at: 0.75, m: { icon: '💚', title: '光幕搖曳', desc: '極光愈發璀璨，即將到達終點！' } },
    { at: 1.00, m: { icon: '✨', title: '極光圓滿', desc: '感謝你在極光下留下足跡！' } },
  ],
  space: [
    { at: 0.25, m: { icon: '🚀', title: 'LIFTOFF', desc: '已脫離大氣層，進入太空！' } },
    { at: 0.50, m: { icon: '🌍', title: 'HALFWAY THERE', desc: '地球已在身後，目標在前！' } },
    { at: 0.75, m: { icon: '🛸', title: 'DEEP SPACE', desc: '進入深空，幾乎抵達目的地！' } },
    { at: 1.00, m: { icon: '⭐', title: 'MISSION COMPLETE', desc: '任務圓滿完成，感謝探索！' } },
  ],
  minimal: [
    { at: 0.25, m: { icon: '○', title: '進度 25%', desc: '已完成四分之一。' } },
    { at: 0.50, m: { icon: '◑', title: '進度 50%', desc: '已完成一半。' } },
    { at: 0.75, m: { icon: '◕', title: '進度 75%', desc: '即將完成。' } },
    { at: 1.00, m: { icon: '●', title: '完成', desc: '感謝你的填寫。' } },
  ],
}

export function useThemeInteraction(
  theme: SurveyTheme,
  totalSteps: number,
  currentStep: number,
  gameTitles?: string[],
) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<ThemeMilestone | null>(null)

  // Game-specific
  const [gXp, setGXp] = useState(0)
  const [gLv, setGLv] = useState(1)
  const [sparkle, setSparkle] = useState(false)
  const lvRef = useRef(gLv)
  lvRef.current = gLv

  const prevStep = useRef(currentStep)

  useEffect(() => {
    if (currentStep <= prevStep.current) {
      prevStep.current = currentStep
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    // Game XP
    if (theme === 'game') {
      setGXp(prev => {
        const next = prev + 15
        const max = lvRef.current * 100
        if (next >= max) {
          setGLv(l => l + 1)
          return next - max
        }
        return next
      })
      setSparkle(true)
      timer = setTimeout(() => setSparkle(false), 1200)
    }

    // Milestones (all themes)
    const progress = (currentStep + 1) / totalSteps
    const ms = MILESTONES[theme]
    const hit = ms.find(x => progress >= x.at && !unlocked.has(x.m.title))
    if (hit) {
      setUnlocked(prev => new Set(prev).add(hit.m.title))
      setPending(hit.m)
    }

    prevStep.current = currentStep
    return () => { if (timer) clearTimeout(timer) }
  }, [currentStep, totalSteps, theme, unlocked])

  const dismiss = useCallback(() => setPending(null), [])

  return {
    pendingMilestone: pending,
    dismissMilestone: dismiss,
    milestoneCount: unlocked.size,
    game: theme === 'game' ? {
      xp: gXp,
      maxXp: gLv * 100,
      level: gLv,
      playerTitle: (gameTitles?.length ? gameTitles : GAME_TITLES)[Math.min(gLv - 1, (gameTitles?.length || GAME_TITLES.length) - 1)],
      xpSparkle: sparkle,
    } : null,
  }
}

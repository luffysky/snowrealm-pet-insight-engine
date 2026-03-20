'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export interface Achievement {
  icon: string
  name: string
  desc: string
}

const MILESTONES: { at: number; achievement: Achievement }[] = [
  { at: 0.25, achievement: { icon: '🐾', name: '初心踏步', desc: '完成了四分之一的冒險旅程！' } },
  { at: 0.50, achievement: { icon: '📸', name: '記憶收集者', desc: '已經走過一半的旅途！' } },
  { at: 0.75, achievement: { icon: '🗺️', name: '探險家之心', desc: '即將抵達旅途終點！' } },
  { at: 1.00, achievement: { icon: '⭐', name: '冒險達人', desc: '成功完成整段冒險！' } },
]

const TITLES = ['見習毛友', '初階毛友', '中階毛友', '資深毛友', '毛行達人']

export function useGameState(totalSteps: number, currentStep: number) {
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [unlockedNames, setUnlockedNames] = useState<Set<string>>(new Set())
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null)
  const [xpSparkle, setXpSparkle] = useState(false)
  const prevStepRef = useRef(currentStep)
  const levelRef = useRef(level)
  levelRef.current = level

  const maxXp = level * 100
  const playerTitle = TITLES[Math.min(level - 1, TITLES.length - 1)]

  useEffect(() => {
    if (currentStep > prevStepRef.current) {
      const gain = 15
      setXp(prev => {
        const newXp = prev + gain
        const curMax = levelRef.current * 100
        if (newXp >= curMax) {
          setLevel(lv => lv + 1)
          return newXp - curMax
        }
        return newXp
      })
      setXpSparkle(true)
      const timer = setTimeout(() => setXpSparkle(false), 1200)

      // Check milestone achievements
      const progress = (currentStep + 1) / totalSteps
      const nextMilestone = MILESTONES.find(
        m => progress >= m.at && !unlockedNames.has(m.achievement.name)
      )
      if (nextMilestone) {
        setUnlockedNames(prev => new Set(prev).add(nextMilestone.achievement.name))
        setPendingAchievement(nextMilestone.achievement)
      }

      prevStepRef.current = currentStep
      return () => clearTimeout(timer)
    }
  }, [currentStep, totalSteps, unlockedNames])

  const dismissAchievement = useCallback(() => {
    setPendingAchievement(null)
  }, [])

  return {
    xp,
    maxXp,
    level,
    playerTitle,
    achievementCount: unlockedNames.size,
    pendingAchievement,
    dismissAchievement,
    xpSparkle,
  }
}

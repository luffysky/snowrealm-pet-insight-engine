'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { SurveyTheme, ThemeIntensity } from '@/types'

interface ThemeContextValue {
  theme: SurveyTheme
  setTheme: (t: SurveyTheme) => void
  intensity: ThemeIntensity
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
  intensity: 2,
})

export function useTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'survey-user-theme'

export function ThemeProvider({
  children,
  initialTheme = 'default',
  intensityMap = { default: 2, game: 2, cyber: 2, ancient: 2, sakura: 2, ocean: 2, forest: 2, candy: 2, noir: 2 },
}: {
  children: React.ReactNode
  initialTheme?: SurveyTheme
  intensityMap?: Record<SurveyTheme, ThemeIntensity>
}) {
  const [theme, setThemeState] = useState<SurveyTheme>(initialTheme)
  const intensity = intensityMap[theme] ?? 2

  // 使用者手動選主題 → 存 sessionStorage
  const setTheme = (t: SurveyTheme) => {
    setThemeState(t)
    if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, t)
  }

  // hydration 後讀 sessionStorage（避免 SSR mismatch）
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY) as SurveyTheme | null
    if (stored) {
      setThemeState(stored)
    } else {
      setThemeState(initialTheme)
    }
  }, [initialTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-survey-theme', theme)
    document.documentElement.setAttribute('data-theme-intensity', String(intensity))
    return () => {
      document.documentElement.removeAttribute('data-survey-theme')
      document.documentElement.removeAttribute('data-theme-intensity')
    }
  }, [theme, intensity])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, intensity }}>
      {children}
    </ThemeContext.Provider>
  )
}

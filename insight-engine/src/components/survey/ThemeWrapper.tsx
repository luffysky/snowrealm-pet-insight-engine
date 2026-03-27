'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { THEME_LIST, stepTextClass } from '@/lib/themes'
import type { SurveyTheme, ThemeIntensity } from '@/types'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

const SLUG = 'maoxingtianxia-mvp-survey'

/**
 * 包裝 server component children，自動載入主題設定 + ThemeProvider
 * 使用者可在封面頁自選主題（如果 allowUserChoice=true）
 */
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings | null>(null)

  useEffect(() => {
    fetch(`/api/surveys/theme?slug=${SLUG}`)
      .then(r => r.json() as Promise<ThemeSettings>)
      .then(setSettings)
      .catch(() => setSettings({
        defaultTheme: 'default',
        availableThemes: ['default'],
        allowUserChoice: false,
        themeIntensity: { default: 2, game: 2, cyber: 2, ancient: 2, sakura: 2, ocean: 2, forest: 2, candy: 2, noir: 2, sunset: 2, neon: 2, aurora: 2, space: 2, minimal: 2 },
      }))
  }, [])

  if (!settings) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <p className="text-white/50">載入中...</p>
      </div>
    )
  }

  return (
    <ThemeProvider initialTheme={settings.defaultTheme} intensityMap={settings.themeIntensity}>
      {children}
    </ThemeProvider>
  )
}

/** 封面頁的主題選擇器 — 當 allowUserChoice=true 時顯示 */
export function ThemeSelector({ availableThemes }: { availableThemes: SurveyTheme[] }) {
  const { theme, setTheme } = useTheme()

  if (availableThemes.length <= 1) return null

  const themes = THEME_LIST.filter(t => availableThemes.includes(t.value))

  return (
    <div className="space-y-3">
      <p className={`text-sm ${stepTextClass[theme]}`}>選擇問卷風格</p>
      <div className="flex flex-wrap justify-center gap-2">
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`px-3 py-2 rounded-xl text-sm border transition-all cursor-pointer ${
              theme === t.value
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15 hover:text-white/60'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThemeProvider, useTheme } from '@/components/survey/ThemeContext'
import { SurveyShell, SurveyCard } from '@/components/survey'
import { THEME_LIST, ctaBtnClass, questionTitleClass, stepTextClass } from '@/lib/themes'
import type { SurveyTheme, ThemeIntensity, SurveyConfig } from '@/types'
import { MVP_SURVEY_SLUG } from '@/constants'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

export function CoverClient() {
  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/surveys/${MVP_SURVEY_SLUG}`).then(r => r.json() as Promise<SurveyConfig>),
      fetch(`/api/surveys/theme?slug=${MVP_SURVEY_SLUG}`).then(r => r.json() as Promise<ThemeSettings>),
    ])
      .then(([surveyData, themeData]) => {
        setConfig(surveyData)
        setThemeSettings(themeData)
      })
      .catch(() => {})
  }, [])

  if (!config || !themeSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <p className="text-white/50 animate-pulse">載入中...</p>
      </div>
    )
  }

  return (
    <ThemeProvider initialTheme={themeSettings.defaultTheme} intensityMap={themeSettings.themeIntensity}>
      <CoverContent config={config} themeSettings={themeSettings} />
    </ThemeProvider>
  )
}

function CoverContent({ config, themeSettings }: { config: SurveyConfig; themeSettings: ThemeSettings }) {
  const { theme, setTheme } = useTheme()
  const availableThemes = THEME_LIST.filter(t => themeSettings.availableThemes.includes(t.value))

  return (
    <SurveyShell>
      <SurveyCard>
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
              {config.coverTitle}
            </h1>
            <p className={`text-base leading-relaxed ${stepTextClass[theme]} !text-base opacity-70`}>
              {config.coverSubtitle}
            </p>
          </div>

          {/* 主題選擇器 */}
          {themeSettings.allowUserChoice && availableThemes.length > 1 && (
            <div className="space-y-3">
              <p className={`text-sm ${stepTextClass[theme]}`}>選擇問卷風格</p>
              <div className="flex justify-center">
                <select
                  value={theme}
                  onChange={e => setTheme(e.target.value as SurveyTheme)}
                  className="px-4 py-2.5 rounded-xl text-sm border bg-white/5 border-white/20 text-white backdrop-blur-sm appearance-none cursor-pointer transition-all hover:border-white/30 focus:border-white/40 focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white [&>option:hover]:bg-white [&>option:hover]:text-gray-900 [&>option:checked]:bg-blue-600 [&>option:checked]:text-white"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
                >
                  {availableThemes.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Link href="/survey" className={ctaBtnClass[theme]}>
            {config.startButtonText}
          </Link>

          <p className={`text-xs ${stepTextClass[theme]}`}>
            共 {config.questions.filter(q => !q.route || q.route === 'A' || q.route === 'all').length} 題，約 2 分鐘完成
          </p>
        </div>
      </SurveyCard>
    </SurveyShell>
  )
}

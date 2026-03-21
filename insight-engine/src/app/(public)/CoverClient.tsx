'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThemeProvider, useTheme } from '@/components/survey/ThemeContext'
import { SurveyShell, SurveyCard } from '@/components/survey'
import { THEME_LIST, ctaBtnClass, questionTitleClass, stepTextClass } from '@/lib/themes'
import type { SurveyTheme, ThemeIntensity, SurveyConfig } from '@/types'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

export function CoverClient() {
  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    // 先取得主問卷 slug，再載入問卷設定
    fetch('/api/primary-survey')
      .then(r => r.json() as Promise<{ slug: string }>)
      .then(({ slug: primarySlug }) => {
        setSlug(primarySlug)
        return Promise.all([
          fetch(`/api/surveys/${primarySlug}`).then(r => r.json() as Promise<SurveyConfig>),
          fetch(`/api/surveys/theme?slug=${primarySlug}`).then(r => r.json() as Promise<ThemeSettings>),
        ])
      })
      .then(([surveyData, themeData]) => {
        setConfig(surveyData)
        setThemeSettings(themeData)
      })
      .catch(() => {})
  }, [])

  if (!config || !themeSettings || !slug) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <p className="text-white/50 animate-pulse">載入中...</p>
      </div>
    )
  }

  return (
    <ThemeProvider initialTheme={themeSettings.defaultTheme} intensityMap={themeSettings.themeIntensity}>
      <CoverContent config={config} themeSettings={themeSettings} slug={slug} />
    </ThemeProvider>
  )
}

function CoverContent({ config, themeSettings, slug }: { config: SurveyConfig; themeSettings: ThemeSettings; slug: string }) {
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
            {config.subtitle && (
              <p className={`text-lg font-medium ${questionTitleClass[theme]} opacity-80`}>
                {config.subtitle}
              </p>
            )}
            <p className={`text-base leading-relaxed ${stepTextClass[theme]} text-base! opacity-70`}>
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

          <Link href={`/survey/${slug}`} className={ctaBtnClass[theme]}>
            {config.startButtonText}
          </Link>

          <p className={`text-xs ${stepTextClass[theme]}`}>
            共 {config.questions.filter(q => !q.route || q.route === 'A' || q.route === 'all').length} 題，約 2 分鐘完成
          </p>
        </div>
      </SurveyCard>

      {/* Platform CTA */}
      <div className="mt-6 max-w-md mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/4 to-white/2 backdrop-blur-sm p-5 text-center space-y-3">
          <div className="absolute inset-0 bg-linear-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
          <div className="relative space-y-3">
            <p className="text-[11px] text-white/30 tracking-widest uppercase">Powered by</p>
            <p className="text-sm font-semibold text-white/70">SnowRealm Insight Engine</p>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
              9 種主題風格、AI 出題、分流邏輯、CRM 標籤 —<br/>
              3 分鐘建立你的第一份專業問卷
            </p>
            <a
              href="/register"
              className="inline-block px-5 py-2 rounded-full text-xs font-medium bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all"
            >
              免費建立我的問卷 →
            </a>
          </div>
        </div>
      </div>
    </SurveyShell>
  )
}

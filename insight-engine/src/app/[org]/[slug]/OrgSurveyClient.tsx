'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSurveyFlow } from '@/hooks/useSurveyFlow'
import { useThemeInteraction } from '@/hooks/useThemeInteraction'
import {
  SurveyShell,
  SurveyCard,
  QuestionSingle,
  QuestionMultiple,
  QuestionText,
} from '@/components/survey'
import { QuestionRating } from '@/components/survey/QuestionRating'
import { QuestionScale } from '@/components/survey/QuestionScale'
import { QuestionDate } from '@/components/survey/QuestionDate'
import { QuestionFileUpload } from '@/components/survey/QuestionFileUpload'
import { ThemeProvider, useTheme } from '@/components/survey/ThemeContext'
import { ThemeProgress } from '@/components/survey/theme/ThemeProgress'
import { ThemeMilestone } from '@/components/survey/theme/ThemeMilestone'
import { ParticleCanvas } from '@/components/survey/theme/ParticleCanvas'
import { THEME_LIST, actionBtnClass, ctaBtnClass, stepTextClass, questionTitleClass } from '@/lib/themes'
import type { SurveyConfig, SurveyTheme, ThemeIntensity, UtmParams } from '@/types'
import { generateFingerprint } from '@/lib/fingerprint'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

function SurveyContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | undefined>()

  useEffect(() => {
    if (!slug) return
    Promise.all([
      fetch(`/api/surveys/${slug}`).then(r => {
        if (!r.ok) throw new Error('survey')
        return r.json() as Promise<SurveyConfig>
      }),
      fetch(`/api/surveys/theme?slug=${slug}`).then(r => r.json() as Promise<ThemeSettings>),
    ])
      .then(([surveyData, themeData]) => {
        setConfig(surveyData)
        setThemeSettings(themeData)
      })
      .catch(() => setLoadError(true))
  }, [slug])

  useEffect(() => {
    generateFingerprint().then(setFingerprint).catch(() => {})
  }, [])

  if (loadError) {
    return (
      <ThemeProvider>
        <SurveyShell>
          <SurveyCard>
            <p className="text-center text-red-400">問卷載入失敗，請重新整理頁面</p>
          </SurveyCard>
        </SurveyShell>
      </ThemeProvider>
    )
  }

  if (!config || !themeSettings) {
    return (
      <ThemeProvider>
        <SurveyShell>
          <SurveyCard>
            <p className="text-center text-white/50">載入中...</p>
          </SurveyCard>
        </SurveyShell>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider
      initialTheme={themeSettings.defaultTheme}
      intensityMap={themeSettings.themeIntensity}
    >
      <SurveyFlowWithCover config={config} slug={slug} searchParams={searchParams} router={router} fingerprint={fingerprint} />
    </ThemeProvider>
  )
}

/** Cover screen → then SurveyFlow */
function SurveyFlowWithCover({
  config,
  slug,
  searchParams,
  router,
  fingerprint,
}: {
  config: SurveyConfig
  slug: string
  searchParams: ReturnType<typeof useSearchParams>
  router: ReturnType<typeof useRouter>
  fingerprint?: string
}) {
  const [started, setStarted] = useState(false)
  const { theme, setTheme } = useTheme()

  const [ts, setTs] = useState<ThemeSettings | null>(null)
  useEffect(() => {
    fetch(`/api/surveys/theme?slug=${slug}`)
      .then(r => r.json() as Promise<ThemeSettings>)
      .then(setTs)
      .catch(() => {})
  }, [slug])

  const availableThemes = ts
    ? THEME_LIST.filter(t => ts.availableThemes.includes(t.value))
    : []

  if (!started) {
    return (
      <>
        <ParticleCanvas theme={theme} />
        <SurveyShell>
          <SurveyCard>
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
                  {config.coverTitle || config.title}
                </h1>
                {config.subtitle && (
                  <p className={`text-lg font-medium ${questionTitleClass[theme]} opacity-80`}>
                    {config.subtitle}
                  </p>
                )}
                {config.coverSubtitle && (
                  <p className={`text-base leading-relaxed ${stepTextClass[theme]} text-base! opacity-70`}>
                    {config.coverSubtitle}
                  </p>
                )}
              </div>

              {/* 主題選擇器 */}
              {ts?.allowUserChoice && availableThemes.length > 1 && (
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

              <button
                type="button"
                onClick={() => setStarted(true)}
                className={ctaBtnClass[theme]}
              >
                {config.startButtonText || '開始填寫'}
              </button>

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
      </>
    )
  }

  return (
    <SurveyFlow config={config} slug={slug} searchParams={searchParams} router={router} fingerprint={fingerprint} />
  )
}

function SurveyFlow({
  config,
  slug,
  searchParams,
  router,
  fingerprint,
}: {
  config: SurveyConfig
  slug: string
  searchParams: ReturnType<typeof useSearchParams>
  router: ReturnType<typeof useRouter>
  fingerprint?: string
}) {
  const { theme } = useTheme()
  const utm: UtmParams = {
    source: searchParams.get('utm_source') ?? undefined,
    medium: searchParams.get('utm_medium') ?? undefined,
    campaign: searchParams.get('utm_campaign') ?? undefined,
  }

  const {
    currentStep,
    totalSteps,
    currentQuestion,
    answers,
    isSubmitting,
    isCompleted,
    submitError,
    alreadySubmitted,
    handleSingleSelect,
    handleMultipleToggle,
    handleTextChange,
    handleAnswerUpdate,
    handleNext,
    handlePrevious,
    dismissDuplicate,
  } = useSurveyFlow({
    questions: config.questions,
    surveySlug: config.slug,
    utm,
    fingerprint,
    branchConfig: config.branchConfig,
  })

  const { pendingMilestone, dismissMilestone, milestoneCount, game } =
    useThemeInteraction(theme, totalSteps, currentStep)

  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next')
  const prevStepRef = useRef(currentStep)
  useEffect(() => {
    setFlipDir(currentStep > prevStepRef.current ? 'next' : 'prev')
    prevStepRef.current = currentStep
  }, [currentStep])

  useEffect(() => {
    if (isCompleted) {
      const gameStats = {
        level: game?.level ?? 1,
        totalXp: (game?.level ? (game.level - 1) * 100 : 0) + (game?.xp ?? 0),
        xp: game?.xp ?? 0,
        maxXp: game?.maxXp ?? 100,
        milestoneCount,
        playerTitle: game?.playerTitle ?? '見習毛友',
        totalSteps,
        theme,
      }
      sessionStorage.setItem('gameStats', JSON.stringify(gameStats))
      sessionStorage.setItem('surveySlug', slug)
      router.push('/done')
    }
  }, [isCompleted, router, game, milestoneCount, totalSteps, theme, slug])

  if (isCompleted) return null
  if (!currentQuestion) return null

  const currentAnswer = answers.get(currentQuestion.key)
  const isMultipleOrText =
    currentQuestion.type !== 'single'

  const canProceed = currentQuestion.isRequired
    ? currentAnswer !== undefined &&
      currentAnswer !== '' &&
      (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true)
    : true

  return (
    <>
      <ParticleCanvas theme={theme} />
      <SurveyShell>
        <div className="relative z-10 space-y-6">
          {alreadySubmitted && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center space-y-3">
              <p className="text-yellow-300 text-sm">你似乎已經填過這份問卷了 🐾</p>
              <button type="button" onClick={dismissDuplicate} className="text-xs text-white/50 hover:text-white/80 cursor-pointer">
                我還是想再填一次
              </button>
            </div>
          )}

          <ThemeProgress theme={theme} currentStep={currentStep + 1} totalSteps={totalSteps} game={game} />

          <div className="card-flip-perspective">
            <div key={currentStep} className={`card-flip-wrapper ${flipDir === 'next' ? 'card-flip-in-next' : 'card-flip-in-prev'}`}>
              <SurveyCard>
                <div className="space-y-6">
                  {currentQuestion.type === 'single' && (
                    <QuestionSingle content={currentQuestion.content} options={currentQuestion.options}
                      selectedValue={(currentAnswer as string) ?? null} onSelect={handleSingleSelect}
                      questionEmoji={currentQuestion.emoji} narrative={currentQuestion.narrative}
                      allowOtherText={currentQuestion.allowOtherText} />
                  )}
                  {currentQuestion.type === 'multiple' && (
                    <QuestionMultiple content={currentQuestion.content} options={currentQuestion.options}
                      selectedValues={(currentAnswer as string[]) ?? []} maxSelections={currentQuestion.maxSelections}
                      onToggle={handleMultipleToggle} onAnswerUpdate={handleAnswerUpdate}
                      questionEmoji={currentQuestion.emoji} narrative={currentQuestion.narrative}
                      allowOtherText={currentQuestion.allowOtherText} />
                  )}
                  {currentQuestion.type === 'text' && (
                    <QuestionText content={currentQuestion.content} value={(currentAnswer as string) ?? ''}
                      onChange={handleTextChange} isRequired={currentQuestion.isRequired} />
                  )}

                  {currentQuestion.type === 'rating' && (
                    <QuestionRating
                      content={currentQuestion.content}
                      value={currentAnswer ? Number(currentAnswer) : null}
                      onChange={(v) => handleTextChange(String(v))}
                      max={currentQuestion.max ?? 5}
                    />
                  )}

                  {currentQuestion.type === 'scale' && (
                    <QuestionScale
                      content={currentQuestion.content}
                      value={currentAnswer ? Number(currentAnswer) : null}
                      onChange={(v) => handleTextChange(String(v))}
                      min={currentQuestion.min ?? 1}
                      max={currentQuestion.max ?? 10}
                      step={currentQuestion.step ?? 1}
                    />
                  )}

                  {currentQuestion.type === 'date' && (
                    <QuestionDate
                      content={currentQuestion.content}
                      value={(currentAnswer as string) ?? ''}
                      onChange={handleTextChange}
                      isRequired={currentQuestion.isRequired}
                    />
                  )}

                  {currentQuestion.type === 'file_upload' && (
                    <QuestionFileUpload
                      content={currentQuestion.content}
                      value={(currentAnswer as string) ?? ''}
                      onChange={handleTextChange}
                      isRequired={currentQuestion.isRequired}
                      acceptedFileTypes={currentQuestion.acceptedFileTypes}
                      maxFileSize={currentQuestion.maxFileSize}
                    />
                  )}

                  {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={handlePrevious} disabled={currentStep === 0}
                      className={`text-sm ${stepTextClass[theme]} hover:opacity-80 disabled:opacity-0 transition-colors cursor-pointer disabled:cursor-default`}>
                      ← 上一題
                    </button>
                    {isMultipleOrText && (
                      <button type="button" onClick={handleNext} disabled={!canProceed || isSubmitting} className={actionBtnClass[theme]}>
                        {isSubmitting ? '提交中...' : currentStep === totalSteps - 1 ? '提交問卷' : '下一題 →'}
                      </button>
                    )}
                  </div>
                </div>
              </SurveyCard>
            </div>
          </div>
        </div>
      </SurveyShell>
      <ThemeMilestone theme={theme} milestone={pendingMilestone} onDismiss={dismissMilestone} />
    </>
  )
}

export function OrgSurveyClient({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <ThemeProvider>
          <SurveyShell>
            <SurveyCard>
              <p className="text-center text-white/50">載入中...</p>
            </SurveyCard>
          </SurveyShell>
        </ThemeProvider>
      }
    >
      <SurveyContent slug={slug} />
    </Suspense>
  )
}

'use client'

import { useSearchParams, useRouter, useParams } from 'next/navigation'
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
import { actionBtnClass, ctaBtnClass, questionTitleClass, stepTextClass, THEME_LIST } from '@/lib/themes'
import type { SurveyConfig, SurveyTheme, ThemeIntensity, UtmParams } from '@/types'
import { generateFingerprint } from '@/lib/fingerprint'

interface ThemeSettings {
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, ThemeIntensity>
}

function SurveyContent() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
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
      <SurveyFlowWithCover config={config} themeSettings={themeSettings} slug={slug} searchParams={searchParams} router={router} fingerprint={fingerprint} />
    </ThemeProvider>
  )
}

/** 密碼門 */
function PasswordGate({ slug, onPass }: { slug: string; onPass: () => void }) {
  const { theme } = useTheme()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/surveys/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password: input }),
      })
      const data = await res.json() as { valid?: boolean }
      if (data.valid) { onPass() } else { setError('密碼錯誤，請再試一次') }
    } catch { setError('驗證失敗，請重新整理') } finally { setChecking(false) }
  }

  return (
    <>
      <ParticleCanvas theme={theme} />
      <SurveyShell>
        <SurveyCard>
          <form onSubmit={handleSubmit} className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-3xl">🔒</p>
              <h2 className={`text-xl font-bold ${questionTitleClass[theme]}`}>此問卷已設定密碼保護</h2>
              <p className={`text-sm ${stepTextClass[theme]}`}>請輸入密碼以繼續</p>
            </div>
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="輸入密碼"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-white/40"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={!input || checking} className={`${ctaBtnClass[theme]} disabled:opacity-50 disabled:cursor-not-allowed`}>
              {checking ? '驗證中...' : '進入問卷'}
            </button>
          </form>
        </SurveyCard>
      </SurveyShell>
    </>
  )
}

/** 封面頁 → 題目流程 */
function SurveyFlowWithCover({
  config,
  themeSettings,
  slug,
  searchParams,
  router,
  fingerprint,
}: {
  config: SurveyConfig
  themeSettings: ThemeSettings
  slug: string
  searchParams: ReturnType<typeof useSearchParams>
  router: ReturnType<typeof useRouter>
  fingerprint?: string
}) {
  const [started, setStarted] = useState(false)
  const [passwordPassed, setPasswordPassed] = useState(!(config.hasPassword ?? false))
  const { theme, setTheme } = useTheme()

  const availableThemes = THEME_LIST.filter(t => themeSettings.availableThemes.includes(t.value))

  if (!passwordPassed) {
    return <PasswordGate slug={slug} onPass={() => setPasswordPassed(true)} />
  }

  if (!started) {
    return (
      <>
        <ParticleCanvas theme={theme} />
        <SurveyShell>
          <SurveyCard>
            <div className="text-center space-y-8">
              {config.coverImageUrl && (
                <img src={config.coverImageUrl} alt={config.title} className="w-full max-h-64 object-cover rounded-xl" />
              )}
              <div className="space-y-4">
                <h1 className={`text-2xl md:text-3xl font-bold leading-snug ${questionTitleClass[theme]}`}>
                  {config.coverTitle || config.title}
                </h1>
                {config.subtitle && (
                  <p className={`text-lg font-medium ${questionTitleClass[theme]} opacity-80`}>{config.subtitle}</p>
                )}
                {config.coverSubtitle && (
                  <p className={`text-base leading-relaxed ${stepTextClass[theme]} opacity-70`}>{config.coverSubtitle}</p>
                )}
              </div>
              {themeSettings.allowUserChoice && availableThemes.length > 1 && (
                <div className="space-y-3">
                  <p className={`text-sm ${stepTextClass[theme]}`}>選擇問卷風格</p>
                  <div className="flex justify-center">
                    <select
                      value={theme}
                      onChange={e => setTheme(e.target.value as SurveyTheme)}
                      className="px-4 py-2.5 rounded-xl text-sm border bg-white/5 border-white/20 text-white appearance-none cursor-pointer focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
                    >
                      {availableThemes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setStarted(true)} className={ctaBtnClass[theme]}>
                {config.startButtonText || '開始填寫'}
              </button>
            </div>
          </SurveyCard>
        </SurveyShell>
      </>
    )
  }

  return <SurveyFlow config={config} slug={slug} searchParams={searchParams} router={router} fingerprint={fingerprint} />
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
    useThemeInteraction(theme, totalSteps, currentStep, config.gameTitles)

  // Card flip 方向追蹤
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
        milestoneCount: milestoneCount,
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
              <button
                type="button"
                onClick={dismissDuplicate}
                className="text-xs text-white/50 hover:text-white/80 cursor-pointer"
              >
                我還是想再填一次
              </button>
            </div>
          )}

          <ThemeProgress
            theme={theme}
            currentStep={currentStep + 1}
            totalSteps={totalSteps}
            game={game}
          />

          <div className="card-flip-perspective">
            <div
              key={currentStep}
              className={`card-flip-wrapper ${flipDir === 'next' ? 'card-flip-in-next' : 'card-flip-in-prev'}`}
            >
              <SurveyCard>
                <div className="space-y-6">
                {currentQuestion.type === 'single' && (
                  <QuestionSingle
                    content={currentQuestion.content}
                    options={currentQuestion.options}
                    selectedValue={(currentAnswer as string) ?? null}
                    onSelect={handleSingleSelect}
                    questionEmoji={currentQuestion.emoji}
                    narrative={currentQuestion.narrative}
                    allowOtherText={currentQuestion.allowOtherText}
                  />
                )}

                {currentQuestion.type === 'multiple' && (
                  <QuestionMultiple
                    content={currentQuestion.content}
                    options={currentQuestion.options}
                    selectedValues={(currentAnswer as string[]) ?? []}
                    maxSelections={currentQuestion.maxSelections}
                    onToggle={handleMultipleToggle}
                    onAnswerUpdate={handleAnswerUpdate}
                    questionEmoji={currentQuestion.emoji}
                    narrative={currentQuestion.narrative}
                    allowOtherText={currentQuestion.allowOtherText}
                  />
                )}

                {currentQuestion.type === 'text' && (
                  <QuestionText
                    content={currentQuestion.content}
                    value={(currentAnswer as string) ?? ''}
                    onChange={handleTextChange}
                    isRequired={currentQuestion.isRequired}
                  />
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

                {submitError && (
                  <p className="text-red-400 text-sm">{submitError}</p>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className={`text-sm ${stepTextClass[theme]} hover:opacity-80 disabled:opacity-0 transition-colors cursor-pointer disabled:cursor-default`}
                  >
                    ← 上一題
                  </button>

                  {isMultipleOrText && (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed || isSubmitting}
                      className={actionBtnClass[theme]}
                    >
                      {isSubmitting
                        ? '提交中...'
                        : currentStep === totalSteps - 1
                          ? '提交問卷'
                          : '下一題 →'}
                    </button>
                  )}
                </div>
                </div>
              </SurveyCard>
            </div>
          </div>
        </div>
      </SurveyShell>

      <ThemeMilestone
        theme={theme}
        milestone={pendingMilestone}
        onDismiss={dismissMilestone}
      />
    </>
  )
}

export default function SurveySlugPage() {
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
      <SurveyContent />
    </Suspense>
  )
}

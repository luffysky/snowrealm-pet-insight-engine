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
import { actionBtnClass, stepTextClass } from '@/lib/themes'
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
      <SurveyFlow config={config} slug={slug} searchParams={searchParams} router={router} fingerprint={fingerprint} />
    </ThemeProvider>
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

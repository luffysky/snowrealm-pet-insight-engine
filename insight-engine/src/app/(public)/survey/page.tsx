'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useSurveyFlow } from '@/hooks/useSurveyFlow'
import {
  SurveyShell,
  SurveyCard,
  ProgressBar,
  QuestionSingle,
  QuestionMultiple,
  QuestionText,
} from '@/components/survey'
import type { Question, SurveyConfig, UtmParams } from '@/types'
import { generateFingerprint } from '@/lib/fingerprint'

function SurveyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | undefined>()

  const slug = 'maoxingtianxia-mvp-survey'

  useEffect(() => {
    fetch(`/api/surveys/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load survey')
        return res.json() as Promise<SurveyConfig>
      })
      .then(setConfig)
      .catch(() => setLoadError(true))
  }, [])

  useEffect(() => {
    generateFingerprint().then(setFingerprint).catch(() => {})
  }, [])

  if (loadError) {
    return (
      <SurveyShell>
        <SurveyCard>
          <p className="text-center text-red-400">問卷載入失敗，請重新整理頁面</p>
        </SurveyCard>
      </SurveyShell>
    )
  }

  if (!config) {
    return (
      <SurveyShell>
        <SurveyCard>
          <p className="text-center text-white/50">載入中...</p>
        </SurveyCard>
      </SurveyShell>
    )
  }

  return <SurveyFlow config={config} searchParams={searchParams} router={router} fingerprint={fingerprint} />
}

function SurveyFlow({
  config,
  searchParams,
  router,
  fingerprint,
}: {
  config: SurveyConfig
  searchParams: ReturnType<typeof useSearchParams>
  router: ReturnType<typeof useRouter>
  fingerprint?: string
}) {
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
    handleNext,
    handlePrevious,
    dismissDuplicate,
  } = useSurveyFlow({
    questions: config.questions,
    surveySlug: config.slug,
    utm,
    fingerprint,
  })

  useEffect(() => {
    if (isCompleted) {
      router.push('/done')
    }
  }, [isCompleted, router])

  if (isCompleted) return null

  if (!currentQuestion) return null

  const currentAnswer = answers.get(currentQuestion.key)
  const isMultipleOrText =
    currentQuestion.type === 'multiple' || currentQuestion.type === 'text'

  const canProceed = currentQuestion.isRequired
    ? currentAnswer !== undefined &&
      currentAnswer !== '' &&
      (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true)
    : true

  return (
    <SurveyShell>
      <div className="space-y-6">
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

        <ProgressBar currentStep={currentStep + 1} totalSteps={totalSteps} />

        <SurveyCard>
          <div className="space-y-6">
            <p className="text-sm text-white/40">
              {currentStep + 1} / {totalSteps}
            </p>

            {currentQuestion.type === 'single' && (
              <QuestionSingle
                content={currentQuestion.content}
                options={currentQuestion.options}
                selectedValue={(currentAnswer as string) ?? null}
                onSelect={handleSingleSelect}
              />
            )}

            {currentQuestion.type === 'multiple' && (
              <QuestionMultiple
                content={currentQuestion.content}
                options={currentQuestion.options}
                selectedValues={(currentAnswer as string[]) ?? []}
                maxSelections={currentQuestion.maxSelections}
                onToggle={handleMultipleToggle}
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

            {submitError && (
              <p className="text-red-400 text-sm">{submitError}</p>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="text-sm text-white/40 hover:text-white/70 disabled:opacity-0 transition-colors cursor-pointer disabled:cursor-default"
              >
                ← 上一題
              </button>

              {isMultipleOrText && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || isSubmitting}
                  className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
    </SurveyShell>
  )
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <SurveyShell>
          <SurveyCard>
            <p className="text-center text-white/50">載入中...</p>
          </SurveyCard>
        </SurveyShell>
      }
    >
      <SurveyContent />
    </Suspense>
  )
}

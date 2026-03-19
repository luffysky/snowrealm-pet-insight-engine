'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Question, Answer, SubmitSurveyPayload, UtmParams } from '@/types'

interface UseSurveyFlowParams {
  questions: Question[]
  surveySlug: string
  utm: UtmParams
  fingerprint?: string
}

interface UseSurveyFlowReturn {
  currentStep: number
  totalSteps: number
  currentQuestion: Question | null
  answers: Map<string, string | string[]>
  isSubmitting: boolean
  isCompleted: boolean
  submitError: string | null
  alreadySubmitted: boolean
  handleSingleSelect: (value: string) => void
  handleMultipleToggle: (value: string) => void
  handleTextChange: (value: string) => void
  handleNext: () => void
  handlePrevious: () => void
  dismissDuplicate: () => void
}

export function useSurveyFlow({
  questions,
  surveySlug,
  utm,
  fingerprint,
}: UseSurveyFlowParams): UseSurveyFlowReturn {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const progressIdRef = useRef<string | null>(null)

  const currentQuestion = questions[currentStep] ?? null
  const totalSteps = questions.length

  const answersRef = useRef(answers)
  answersRef.current = answers

  // 開始填答時建立 progress 紀錄（漏斗追蹤）
  useEffect(() => {
    if (!fingerprint || progressIdRef.current) return
    fetch('/api/surveys/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveySlug, fingerprint, action: 'start' }),
    })
      .then((r) => r.json())
      .then((data: { responseId?: string; alreadySubmitted?: boolean }) => {
        progressIdRef.current = data.responseId ?? null
        if (data.alreadySubmitted) setAlreadySubmitted(true)
      })
      .catch(() => {})
  }, [fingerprint, surveySlug])

  // 每切題時更新 progress
  useEffect(() => {
    if (!fingerprint || !progressIdRef.current) return
    fetch('/api/surveys/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surveySlug,
        fingerprint,
        action: 'step',
        responseId: progressIdRef.current,
        step: currentStep,
      }),
    }).catch(() => {})
  }, [currentStep, fingerprint, surveySlug])

  const dismissDuplicate = useCallback(() => setAlreadySubmitted(false), [])

  const updateAnswer = useCallback(
    (key: string, value: string | string[]) => {
      setAnswers((prev) => {
        const next = new Map(prev)
        next.set(key, value)
        return next
      })
    },
    []
  )

  const handleSingleSelect = useCallback(
    (value: string) => {
      if (!currentQuestion) return
      updateAnswer(currentQuestion.key, value)

      // 單選題：選完自動前進
      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep((s) => s + 1)
        } else {
          doSubmit()
        }
      }, 300)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentQuestion, currentStep, totalSteps]
  )

  const handleMultipleToggle = useCallback(
    (value: string) => {
      if (!currentQuestion) return
      const currentValues = (answers.get(currentQuestion.key) as string[]) ?? []

      const isSelected = currentValues.includes(value)
      let nextValues: string[]

      if (isSelected) {
        nextValues = currentValues.filter((v) => v !== value)
      } else {
        const maxSelections = currentQuestion.maxSelections
        if (maxSelections && currentValues.length >= maxSelections) return
        nextValues = [...currentValues, value]
      }

      updateAnswer(currentQuestion.key, nextValues)
    },
    [currentQuestion, answers, updateAnswer]
  )

  const handleTextChange = useCallback(
    (value: string) => {
      if (!currentQuestion) return
      updateAnswer(currentQuestion.key, value)
    },
    [currentQuestion, updateAnswer]
  )

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      doSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, totalSteps])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  async function doSubmit(): Promise<void> {
    setIsSubmitting(true)
    setSubmitError(null)

    const answerList: Answer[] = Array.from(answersRef.current.entries()).map(
      ([questionKey, value]) => ({ questionKey, value })
    )

    const payload: SubmitSurveyPayload = {
      surveySlug,
      answers: answerList,
      utm,
      progressResponseId: progressIdRef.current ?? undefined,
      fingerprint,
    }

    try {
      const response = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? '提交失敗')
      }

      const result = await response.json()
      if (result.responseId) {
        sessionStorage.setItem('lastResponseId', result.responseId)
      }

      setIsCompleted(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '提交失敗，請稍後再試'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}

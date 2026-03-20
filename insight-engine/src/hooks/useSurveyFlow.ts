'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Question, Answer, SubmitSurveyPayload, UtmParams, BranchConfig } from '@/types'

interface UseSurveyFlowParams {
  questions: Question[]
  surveySlug: string
  utm: UtmParams
  fingerprint?: string
  branchConfig?: BranchConfig
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

/** 根據分流題答案決定路線 */
function resolveRoute(
  branchConfig: BranchConfig | undefined,
  answers: Map<string, string | string[]>
): string | null {
  if (!branchConfig) return null
  const branchAnswer = answers.get(branchConfig.branchKey)
  if (!branchAnswer || typeof branchAnswer !== 'string') return null
  for (const [route, values] of Object.entries(branchConfig.routes)) {
    if ((values as string[]).includes(branchAnswer)) return route
  }
  return null
}

/** 根據路線過濾有效題目 */
function filterQuestions(
  questions: Question[],
  route: string | null,
  branchConfig: BranchConfig | undefined
): Question[] {
  if (!branchConfig) {
    // 無分流設定，顯示所有題目
    return questions
  }

  if (!route) {
    // 尚未決定路線：只顯示共用題目 + 分流題本身
    // 不預設顯示任何分流的題目，避免誤導
    return questions.filter((q) => {
      if (!q.route || q.route === 'all') return true
      // 分流題 key 本身一定要顯示
      if (q.key === branchConfig.branchKey) return true
      // A路線題目在分流前也不顯示（除非沒有其他路線）
      return false
    })
  }

  // 已決定路線
  return questions.filter((q) => !q.route || q.route === 'all' || q.route === route)
}

export function useSurveyFlow({
  questions,
  surveySlug,
  utm,
  fingerprint,
  branchConfig,
}: UseSurveyFlowParams): UseSurveyFlowReturn {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const progressIdRef = useRef<string | null>(null)
  const routeRef = useRef<string | null>(null)

  // 計算當前路線與有效題目
  const currentRoute = useMemo(() => resolveRoute(branchConfig, answers), [branchConfig, answers])
  const activeQuestions = useMemo(() => filterQuestions(questions, currentRoute, branchConfig), [questions, currentRoute, branchConfig])
  routeRef.current = currentRoute

  // 當路線改變導致題目列表變化時，修正 currentStep 以防跳到不存在的位置
  const prevActiveLen = useRef(activeQuestions.length)
  useEffect(() => {
    if (activeQuestions.length !== prevActiveLen.current) {
      // 路線決定後題目可能增加（正常）或減少（改答案）
      // 保持當前 step 不超出範圍
      setCurrentStep((s) => Math.min(s, activeQuestions.length - 1))
      prevActiveLen.current = activeQuestions.length
    }
  }, [activeQuestions.length])

  const currentQuestion = activeQuestions[currentStep] ?? null
  const totalSteps = activeQuestions.length

  const answersRef = useRef(answers)
  answersRef.current = answers

  // 路線變更時清除不屬於新路線的答案（避免舊分流答案殘留）
  const prevRouteRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentRoute && prevRouteRef.current && currentRoute !== prevRouteRef.current) {
      // 找出屬於舊路線（不含 all）的題目 keys
      const oldRouteKeys = new Set(
        questions
          .filter((q) => q.route === prevRouteRef.current)
          .map((q) => q.key)
      )
      if (oldRouteKeys.size > 0) {
        setAnswers((prev) => {
          const next = new Map(prev)
          for (const key of oldRouteKeys) next.delete(key)
          return next
        })
      }
    }
    prevRouteRef.current = currentRoute
  }, [currentRoute, questions])

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
      route: routeRef.current ?? undefined,
      lineToken: typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('lt') ?? undefined
        : undefined,
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

        // 如果已透過 LIFF 綁定 LINE userId，自動關聯 responseId
        const lineUserId = sessionStorage.getItem('lineUserId')
        if (lineUserId) {
          fetch('/api/line/liff-bind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId, responseId: result.responseId }),
          }).catch(() => {})
        }
      }

      // 儲存回答紀錄供 done 頁面下載 TXT 用
      const surveyRecord = activeQuestions.map((q) => ({
        content: q.content,
        type: q.type,
        options: q.options,
        answer: answersRef.current.get(q.key) ?? null,
      }))
      sessionStorage.setItem('surveyAnswerRecord', JSON.stringify(surveyRecord))

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

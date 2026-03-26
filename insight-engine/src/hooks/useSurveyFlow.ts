'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Question, Answer, SubmitSurveyPayload, UtmParams, BranchConfig, BranchRule } from '@/types'

/** 正規化：將舊版單物件或新版陣列統一轉為 BranchRule[] */
function normalizeBranchRules(raw: BranchConfig | undefined): BranchRule[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  // 舊版 { branchKey, routes }
  if (raw.branchKey && raw.routes) {
    return [{ id: '__legacy__', branchKey: raw.branchKey, routes: raw.routes }]
  }
  return []
}

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
  handleAnswerUpdate: (value: string | string[]) => void
  handleNext: () => void
  handlePrevious: () => void
  dismissDuplicate: () => void
}

/** 根據所有分流規則與已作答，計算出目前活躍的全部路線 */
function resolveRoutes(
  rules: BranchRule[],
  answers: Map<string, string | string[]>
): Set<string> {
  const active = new Set<string>()

  for (const rule of rules) {
    const branchAnswer = answers.get(rule.branchKey)
    if (!branchAnswer) {
      // 還沒回答分流題 → 不啟動任何分支路線
      continue
    }

    const ansArr = Array.isArray(branchAnswer) ? branchAnswer : [branchAnswer]

    for (const ans of ansArr) {
      for (const [route, values] of Object.entries(rule.routes)) {
        if ((values as string[]).includes(ans)) {
          active.add(route)
        }
      }
    }
  }

  return active
}

/** 根據活躍路線過濾有效題目 */
function filterQuestions(
  questions: Question[],
  activeRoutes: Set<string>,
  rules: BranchRule[]
): Question[] {
  if (rules.length === 0) {
    // 無分流設定，顯示所有題目
    return questions
  }

  const branchKeys = new Set(rules.map(r => r.branchKey))
  // 是否已經有至少一條分流規則生效（分流題已作答）
  const hasAnyBranchDecision = activeRoutes.size > 0

  return questions.filter((q) => {
    // 沒有 route 或 route 是 all → 一律顯示
    if (!q.route || q.route === 'all') return true
    // 分流題本身一定要顯示
    if (branchKeys.has(q.key)) return true
    // 尚未有任何分流決策 → 只顯示 all / 分流題，其餘全隱藏（等待分流）
    if (!hasAnyBranchDecision) return false
    // 已有分流決策 → 只顯示活躍路線的題目
    return activeRoutes.has(q.route)
  })
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

  // 正規化分流規則
  const branchRules = useMemo(() => normalizeBranchRules(branchConfig), [branchConfig])

  // 計算當前活躍路線集合與有效題目
  const activeRoutes = useMemo(() => resolveRoutes(branchRules, answers), [branchRules, answers])
  const activeQuestions = useMemo(() => filterQuestions(questions, activeRoutes, branchRules), [questions, activeRoutes, branchRules])
  // 送出用的 route 字串：以逗號連接所有活躍路線（排除預設 A）
  routeRef.current = Array.from(activeRoutes).sort().join(',') || 'A'

  // 當路線改變導致題目列表變化時，修正 currentStep 以防跳到不存在的位置
  const prevActiveLen = useRef(activeQuestions.length)
  useEffect(() => {
    if (activeQuestions.length !== prevActiveLen.current) {
      setCurrentStep((s) => Math.min(s, Math.max(0, activeQuestions.length - 1)))
      prevActiveLen.current = activeQuestions.length
    }
  }, [activeQuestions.length])

  const currentQuestion = activeQuestions[currentStep] ?? null
  const totalSteps = activeQuestions.length

  const answersRef = useRef(answers)
  answersRef.current = answers

  // 路線變更時：清除已不再活躍路線上的獨佔題目答案
  const prevRoutesRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    // 找出上一輪有但這一輪沒有的路線
    const removedRoutes = new Set<string>()
    for (const r of prevRoutesRef.current) {
      if (!activeRoutes.has(r)) removedRoutes.add(r)
    }
    if (removedRoutes.size > 0) {
      const keysToRemove = new Set(
        questions
          .filter((q) => q.route && removedRoutes.has(q.route))
          .map((q) => q.key)
      )
      if (keysToRemove.size > 0) {
        setAnswers((prev) => {
          const next = new Map(prev)
          for (const key of keysToRemove) next.delete(key)
          return next
        })
      }
    }
    prevRoutesRef.current = new Set(activeRoutes)
  }, [activeRoutes, questions])

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

  const handleAnswerUpdate = useCallback(
    (value: string | string[]) => {
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

      // 儲存回答紀錄供 done 頁面下載 TXT + 結果計分用
      const surveyRecord = activeQuestions.map((q) => ({
        questionKey: q.key,
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
    handleAnswerUpdate,
    handleNext,
    handlePrevious,
    dismissDuplicate,
  }
}

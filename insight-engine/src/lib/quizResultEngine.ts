import type { SurveyConfig } from '@/types/survey'

export interface QuizAnswer {
  questionKey: string
  value: string | string[] | null
}

export interface QuizResultData {
  resultKey: string
  resultType: {
    key: string
    name: string
    emoji: string
    description: string
    traits?: string[]
  } | null
  scoreBreakdown: Record<string, number>
  primaryTrait: string
}

/**
 * 根據 ResultConfig 的 scoringRules 計算問卷結果。
 *
 * scoringRules 格式：
 *   { [questionKey]: { [optionValue]: traitKey } }
 *
 * 每個選項對應到一個 traitKey，計分時累加每個 traitKey 的命中次數，
 * 命中次數最多的 traitKey 即為最終結果。
 */
export function computeQuizResult(
  config: SurveyConfig,
  answers: QuizAnswer[]
): QuizResultData {
  if (!config.resultConfig) {
    return { resultKey: '', resultType: null, scoreBreakdown: {}, primaryTrait: '' }
  }

  const { scoringRules, resultTypes } = config.resultConfig
  const scoreMap: Record<string, number> = {}

  for (const answer of answers) {
    const ruleForQuestion = scoringRules[answer.questionKey]
    if (!ruleForQuestion) continue

    const values = Array.isArray(answer.value)
      ? answer.value
      : answer.value !== null && answer.value !== undefined
      ? [answer.value]
      : []

    for (const v of values) {
      const traitKey = ruleForQuestion[v]
      if (traitKey) {
        scoreMap[traitKey] = (scoreMap[traitKey] ?? 0) + 1
      }
    }
  }

  // 找最高分特質
  const sortedTraits = Object.entries(scoreMap).sort((a, b) => b[1] - a[1])
  const primaryTrait = sortedTraits[0]?.[0] ?? ''

  // 找對應結果類型
  const resultType = resultTypes.find(rt => rt.key === primaryTrait) ?? null

  return {
    resultKey: primaryTrait,
    resultType,
    scoreBreakdown: scoreMap,
    primaryTrait,
  }
}

import type { Answer } from '@/types'
import type { UserTag } from '@/types'
import { query } from '@/lib/db'

interface TagRule {
  [key: string]: unknown
  question_key: string
  answer_value: string | null
  match_mode: 'exact' | 'contains' | 'any'
  tag_key: string
  tag_value: string
  priority: number
}

/**
 * 從 DB 讀取 tag_rules，根據問卷答案自動產生 CRM 標籤
 * 規則可在後台管理，不再 hardcode
 *
 * priority: 同一 tag_key 下，priority 越高的規則優先（先到先得）
 * match_mode:
 *   exact    → 單選答案完全匹配 answer_value
 *   contains → answer_value 出現在多選答案陣列中
 *   any      → 只要該 question_key 有答案就匹配
 */
export async function analyzeResponse(
  answers: Answer[],
  surveyId?: string
): Promise<UserTag[]> {
  // 讀取啟用中的規則（按 priority DESC）
  const rules = await query<TagRule>(
    `SELECT question_key, answer_value, match_mode, tag_key, tag_value, priority
     FROM tag_rules
     WHERE is_active = TRUE
       AND ($1::uuid IS NULL OR survey_id = $1)
     ORDER BY priority DESC, created_at`,
    [surveyId ?? null]
  )

  // 如果 DB 無規則，回傳空（不 fallback 到 hardcode）
  if (rules.length === 0) return []

  const answerMap = buildAnswerMap(answers)
  const tags: UserTag[] = []
  // 同一 tag_key 只保留最高 priority 的規則結果（除非是 contains 多值）
  const seenKeys = new Map<string, Set<string>>()

  for (const rule of rules) {
    const answer = answerMap.get(rule.question_key)
    if (answer === undefined) continue

    let matched = false

    switch (rule.match_mode) {
      case 'exact':
        matched = typeof answer === 'string' && answer === rule.answer_value
        break
      case 'contains':
        matched = Array.isArray(answer) && rule.answer_value !== null && answer.includes(rule.answer_value)
        break
      case 'any':
        matched = true
        break
    }

    if (!matched) continue

    // 去重：同一 tag_key+tag_value 不重複
    const existing = seenKeys.get(rule.tag_key)
    if (existing?.has(rule.tag_value)) continue

    if (!existing) {
      seenKeys.set(rule.tag_key, new Set([rule.tag_value]))
    } else {
      existing.add(rule.tag_value)
    }

    tags.push({ key: rule.tag_key, value: rule.tag_value })
  }

  return tags
}

// ----- 工具函式 -----

type AnswerMap = Map<string, string | string[]>

function buildAnswerMap(answers: Answer[]): AnswerMap {
  const map = new Map<string, string | string[]>()
  for (const answer of answers) {
    map.set(answer.questionKey, answer.value)
  }
  return map
}

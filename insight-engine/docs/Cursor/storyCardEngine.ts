import { query, queryOne } from '@/lib/db'

export interface StoryCardData {
  responseId: string
  surveyTitle: string
  personalFacts: string[]
  groupComparisons: string[]
  shareableOneLiner: string
  surveySlug: string
  generatedAt: string
}

interface ResponseRow extends Record<string, unknown> {
  id: string
  status: string
  survey_id: string
  survey_title: string
  survey_slug: string
}

interface AnswerRow extends Record<string, unknown> {
  question_key: string
  value: string
  question_content: string
  question_type: string
  option_label: string | null
}

interface AggregateRow extends Record<string, unknown> {
  question_key: string
  answer_value: string
  match_count: string
  total_count: string
}

function buildPersonalFact(questionContent: string, answerLabel: string): string {
  return `「${questionContent}」你選擇了「${answerLabel}」`
}

function buildGroupComparison(pct: number, answerLabel: string): string {
  return `${pct}% 的填答者也選擇了「${answerLabel}」`
}

function buildShareableOneLiner(pct: number, answerLabel: string): string {
  return `只有 ${pct}% 的人跟你一樣選擇了「${answerLabel}」`
}

function pickMostUnique(comparisons: Array<{ pct: number; label: string }>): { pct: number; label: string } | null {
  if (comparisons.length === 0) return null
  return comparisons.reduce((prev, curr) =>
    Math.abs(curr.pct - 50) > Math.abs(prev.pct - 50) ? curr : prev
  )
}

export async function buildStoryCard(responseId: string): Promise<StoryCardData | null> {
  const response = await queryOne<ResponseRow>(
    `SELECT r.id, r.status, r.survey_id,
            s.title AS survey_title, s.slug AS survey_slug
     FROM responses r
     JOIN surveys s ON s.id = r.survey_id
     WHERE r.id = $1`,
    [responseId]
  )

  if (!response || response.status !== 'completed') return null

  const answers = await query<AnswerRow>(
    `SELECT a.question_key, a.value,
            q.content AS question_content,
            q.type AS question_type,
            NULL::text AS option_label
     FROM answers a
     LEFT JOIN questions q ON q.survey_id = $1 AND q.key = a.question_key
     WHERE a.response_id = $2
     ORDER BY q.order_index ASC`,
    [response.survey_id, responseId]
  )

  if (answers.length === 0) return null

  const aggregates = await query<AggregateRow>(
    `SELECT
       a.question_key,
       a.value AS answer_value,
       COUNT(*) AS match_count,
       (SELECT COUNT(*) FROM answers a2
        JOIN responses r2 ON r2.id = a2.response_id
        WHERE a2.question_key = a.question_key
          AND r2.survey_id = $1
          AND r2.status = 'completed') AS total_count
     FROM answers a
     JOIN responses r ON r.id = a.response_id
     WHERE r.survey_id = $1
       AND r.status = 'completed'
       AND a.question_key = ANY($2::text[])
     GROUP BY a.question_key, a.value`,
    [
      response.survey_id,
      answers.map((a) => a.question_key),
    ]
  )

  const aggregateMap = new Map<string, Map<string, { match: number; total: number }>>()
  for (const row of aggregates) {
    if (!aggregateMap.has(row.question_key)) {
      aggregateMap.set(row.question_key, new Map())
    }
    aggregateMap.get(row.question_key)!.set(row.answer_value, {
      match: parseInt(row.match_count as string, 10),
      total: parseInt(row.total_count as string, 10),
    })
  }

  const personalFacts: string[] = []
  const comparisonCandidates: Array<{ pct: number; label: string }> = []
  const seenQuestions = new Set<string>()  // 避免同一題重複顯示

  for (const answer of answers) {
    const rawValue: unknown = (() => {
      try { return JSON.parse(answer.value) } catch { return answer.value }
    })()

    const labels: string[] = Array.isArray(rawValue)
      ? rawValue.map(String)
      : [String(rawValue)]

    // 每個題目只出現一次，跳過分流題（通常是 q1）
    if (answer.question_content && labels.length > 0 && !seenQuestions.has(answer.question_key)) {
      seenQuestions.add(answer.question_key)
      personalFacts.push(buildPersonalFact(answer.question_content, labels.join('、')))
    }

    const qAggregates = aggregateMap.get(answer.question_key)
    if (qAggregates) {
      for (const label of labels) {
        const stat = qAggregates.get(label) ?? qAggregates.get(JSON.stringify(label))
        if (stat && stat.total > 0) {
          const pct = Math.round((stat.match / stat.total) * 100)
          comparisonCandidates.push({ pct, label })
        }
      }
    }
  }

  const topFacts = personalFacts.slice(0, 3)

  const sortedByInterest = [...comparisonCandidates].sort(
    (a, b) => Math.abs(b.pct - 50) - Math.abs(a.pct - 50)
  )
  const topComparisons = sortedByInterest
    .slice(0, 2)
    .map((c) => buildGroupComparison(c.pct, c.label))

  const mostUnique = pickMostUnique(
    comparisonCandidates.filter((c) => c.pct <= 30)
  ) ?? pickMostUnique(comparisonCandidates)

  const oneLiner = mostUnique
    ? buildShareableOneLiner(mostUnique.pct, mostUnique.label)
    : '感謝你完成了這份問卷！'

  return {
    responseId,
    surveyTitle: response.survey_title,
    personalFacts: topFacts,
    groupComparisons: topComparisons,
    shareableOneLiner: oneLiner,
    surveySlug: response.survey_slug,
    generatedAt: new Date().toISOString(),
  }
}

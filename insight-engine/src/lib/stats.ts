import { query, queryOne } from './db'
import { TREND_DAYS, MVP_SURVEY_SLUG } from '@/constants'
import type {
  DashboardStats,
  DailyTrendItem,
  FeatureCount,
  TagDistribution,
  QuestionStats,
  ResponseListItem,
  ResponseDetail,
  PaginatedResponse,
  UtmAnalytics,
  UtmSourceStats,
} from '@/types'
import { MVP_SURVEY } from './surveyConfig'
import { getQuestionsBySlug, getQuestionsBySurveyId, getPrimarySurveySlug, toQuestion } from './surveyRepo'

// ===== 共用 WHERE 條件建構（responses 表）=====

function buildWhere(tenantId?: string, surveyId?: string, startIdx = 1) {
  const conds: string[] = []
  const params: unknown[] = []
  let idx = startIdx
  if (tenantId) { conds.push(`tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`survey_id = $${idx++}`); params.push(surveyId) }
  return {
    conds, params, nextIdx: idx,
    where: conds.length ? `WHERE ${conds.join(' AND ')}` : '',
    and: conds.length ? ` AND ${conds.join(' AND ')}` : '',
  }
}

/** 從 DB 取得題目，若無則 fallback 到靜態 config */
async function resolveQuestions(tenantId?: string, surveyId?: string) {
  // 若指定問卷 ID，直接取該問卷的題目
  if (surveyId) {
    const rows = await getQuestionsBySurveyId(surveyId)
    if (rows.length > 0) return rows.map(toQuestion)
  }
  // 否則查租戶的主問卷，再 fallback 到 MVP_SURVEY_SLUG
  const slug = (tenantId ? await getPrimarySurveySlug(tenantId) : null) ?? MVP_SURVEY_SLUG
  const dbQuestions = await getQuestionsBySlug(slug)
  return dbQuestions.length > 0 ? dbQuestions : MVP_SURVEY.questions
}

// ===== Dashboard 統計 =====

export async function getDashboardStats(tenantId?: string, surveyId?: string): Promise<DashboardStats> {
  const [
    totalResponses,
    completedResponses,
    todayResponses,
    dailyTrend,
    topFeatures,
    emotionDistribution,
  ] = await Promise.all([
    countTotalResponses(tenantId, surveyId),
    countCompletedResponses(tenantId, surveyId),
    countTodayResponses(tenantId, surveyId),
    getDailyTrend(tenantId, surveyId),
    getTopFeatures(tenantId, surveyId),
    getEmotionDistribution(tenantId, surveyId),
  ])

  const completionRate =
    totalResponses > 0 ? completedResponses / totalResponses : 0

  return {
    totalResponses,
    completedResponses,
    completionRate,
    todayResponses,
    dailyTrend,
    topFeatures,
    emotionDistribution,
  }
}

async function countTotalResponses(tenantId?: string, surveyId?: string): Promise<number> {
  const { where, params } = buildWhere(tenantId, surveyId)
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM responses ${where}`, params)
  return parseInt(row?.count ?? '0', 10)
}

async function countCompletedResponses(tenantId?: string, surveyId?: string): Promise<number> {
  const { conds, params, nextIdx } = buildWhere(tenantId, surveyId)
  conds.push(`status = $${nextIdx}`)
  params.push('completed')
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM responses WHERE ${conds.join(' AND ')}`, params)
  return parseInt(row?.count ?? '0', 10)
}

async function countTodayResponses(tenantId?: string, surveyId?: string): Promise<number> {
  const { conds, params } = buildWhere(tenantId, surveyId)
  conds.push(`created_at >= CURRENT_DATE`)
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM responses WHERE ${conds.join(' AND ')}`, params)
  return parseInt(row?.count ?? '0', 10)
}

async function getDailyTrend(tenantId?: string, surveyId?: string): Promise<DailyTrendItem[]> {
  const { and, params } = buildWhere(tenantId, surveyId, 2) // $1 = TREND_DAYS
  const rows = await query<{ date: string; count: string }>(
    `SELECT d::date::text AS date, COALESCE(c.cnt, 0)::text AS count
     FROM generate_series(CURRENT_DATE - ($1 - 1) * INTERVAL '1 day', CURRENT_DATE, '1 day') AS d
     LEFT JOIN (
       SELECT created_at::date AS day, COUNT(*) AS cnt
       FROM responses WHERE created_at >= CURRENT_DATE - ($1 - 1) * INTERVAL '1 day'${and}
       GROUP BY created_at::date
     ) c ON c.day = d::date ORDER BY d`,
    [TREND_DAYS, ...params]
  )
  return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }))
}

async function getTopFeatures(tenantId?: string, surveyId?: string): Promise<FeatureCount[]> {
  const conds: string[] = ['question_key = $1']
  const params: unknown[] = ['q8']
  let idx = 2
  if (tenantId) { conds.push(`tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`response_id IN (SELECT id FROM responses WHERE survey_id = $${idx++})`); params.push(surveyId) }

  const rows = await query<{ value: unknown }>(
    `SELECT value FROM answers WHERE ${conds.join(' AND ')}`, params
  )

  if (rows.length === 0) return []

  const countMap = new Map<string, number>()
  for (const row of rows) {
    const values = Array.isArray(row.value) ? row.value : [row.value]
    for (const v of values) {
      if (typeof v === 'string') {
        countMap.set(v, (countMap.get(v) ?? 0) + 1)
      }
    }
  }

  return Array.from(countMap.entries())
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

async function getEmotionDistribution(tenantId?: string, surveyId?: string): Promise<TagDistribution[]> {
  const conds: string[] = ['tag_key = ANY($1)']
  const params: unknown[] = [['emotion_level', 'payment_intent', 'loss_status']]
  let idx = 2
  if (tenantId) { conds.push(`tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`response_id IN (SELECT id FROM responses WHERE survey_id = $${idx++})`); params.push(surveyId) }

  const rows = await query<{ tag_key: string; tag_value: string; count: string }>(
    `SELECT tag_key, tag_value, COUNT(*)::text AS count FROM user_tags WHERE ${conds.join(' AND ')} GROUP BY tag_key, tag_value`,
    params
  )

  return rows.map((r) => ({
    tagKey: r.tag_key,
    tagValue: r.tag_value,
    count: parseInt(r.count, 10),
  }))
}

// ===== 漏斗分析 =====

export interface FunnelStep {
  step: number
  questionKey: string
  questionContent: string
  reached: number
  dropOff: number
  dropOffRate: number
}

export async function getFunnelStats(tenantId?: string, surveyId?: string): Promise<FunnelStep[]> {
  const questions = await resolveQuestions(tenantId, surveyId)

  const { where, params } = buildWhere(tenantId, surveyId)
  const rows = await query<{ last_step: number; count: string }>(
    `SELECT last_step, COUNT(*)::text AS count FROM responses ${where} GROUP BY last_step`, params
  )

  const stepCountMap = new Map<number, number>()
  let totalStarted = 0
  for (const r of rows) {
    const count = parseInt(r.count, 10)
    stepCountMap.set(r.last_step, count)
    totalStarted += count
  }

  // 計算每題的到達人數：到達第 N 題 = last_step >= N 的所有人
  return questions.map((q, i) => {
    let reached = 0
    for (const [step, count] of stepCountMap) {
      if (step >= i) reached += count
    }

    const nextReached = i < questions.length - 1
      ? Array.from(stepCountMap.entries()).reduce(
          (sum, [step, count]) => (step >= i + 1 ? sum + count : sum), 0
        )
      : reached // 最後一步不計 drop-off

    const dropOff = reached - nextReached
    const dropOffRate = reached > 0 ? dropOff / reached : 0

    return {
      step: i,
      questionKey: q.key,
      questionContent: q.content,
      reached,
      dropOff,
      dropOffRate,
    }
  })
}

// ===== 交叉分析 =====

export interface CrossTabResult {
  questionA: string
  questionB: string
  matrix: { rowLabel: string; columns: { colLabel: string; count: number }[] }[]
  rowLabels: string[]
  colLabels: string[]
}

export async function getCrossTabData(
  questionKeyA: string,
  questionKeyB: string,
  tenantId?: string,
  surveyId?: string,
): Promise<CrossTabResult> {
  const conds: string[] = ['a1.question_key = $1', 'a2.question_key = $2']
  const params: unknown[] = [questionKeyA, questionKeyB]
  let idx = 3
  if (tenantId) { conds.push(`a1.tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`a1.response_id IN (SELECT id FROM responses WHERE survey_id = $${idx++})`); params.push(surveyId) }

  const rows = await query<{ val_a: unknown; val_b: unknown }>(
    `SELECT a1.value AS val_a, a2.value AS val_b
     FROM answers a1
     INNER JOIN answers a2 ON a1.response_id = a2.response_id
     WHERE ${conds.join(' AND ')}`,
    params
  )

  // 展開多選答案
  const pairs: [string, string][] = []
  for (const r of rows) {
    const aVals = Array.isArray(r.val_a) ? r.val_a : [r.val_a]
    const bVals = Array.isArray(r.val_b) ? r.val_b : [r.val_b]
    for (const a of aVals) {
      for (const b of bVals) {
        if (typeof a === 'string' && typeof b === 'string') {
          pairs.push([a, b])
        }
      }
    }
  }

  const rowSet = new Set<string>()
  const colSet = new Set<string>()
  const countMap = new Map<string, number>()

  for (const [a, b] of pairs) {
    rowSet.add(a)
    colSet.add(b)
    const key = `${a}||${b}`
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  }

  const rowLabels = [...rowSet]
  const colLabels = [...colSet]

  const matrix = rowLabels.map((rowLabel) => ({
    rowLabel,
    columns: colLabels.map((colLabel) => ({
      colLabel,
      count: countMap.get(`${rowLabel}||${colLabel}`) ?? 0,
    })),
  }))

  return { questionA: questionKeyA, questionB: questionKeyB, matrix, rowLabels, colLabels }
}

// ===== 自動摘要 =====

export async function generateSummary(tenantId?: string, surveyId?: string): Promise<string> {
  const stats = await getDashboardStats(tenantId, surveyId)
  const questions = await resolveQuestions(tenantId, surveyId)
  const funnel = await getFunnelStats(tenantId, surveyId)

  const lines: string[] = []
  lines.push(`📊 毛行天下問卷摘要報告`)
  lines.push(`產出時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`)
  lines.push('')
  lines.push(`📋 基本數據`)
  lines.push(`• 總填寫數：${stats.totalResponses} 份`)
  lines.push(`• 完成數：${stats.completedResponses} 份`)
  lines.push(`• 完成率：${(stats.completionRate * 100).toFixed(1)}%`)
  lines.push(`• 今日新增：${stats.todayResponses} 份`)
  lines.push('')

  if (stats.topFeatures.length > 0) {
    lines.push(`🔥 最受歡迎功能 Top 3`)
    stats.topFeatures.slice(0, 3).forEach((f, i) => {
      lines.push(`  ${i + 1}. ${f.feature}（${f.count} 票）`)
    })
    lines.push('')
  }

  const highEmotion = stats.emotionDistribution.find(
    (d) => d.tagKey === 'emotion_level' && d.tagValue === 'high'
  )
  if (highEmotion && stats.totalResponses > 0) {
    const rate = ((highEmotion.count / stats.totalResponses) * 100).toFixed(1)
    lines.push(`💛 高情感用戶：${highEmotion.count} 人（${rate}%）`)
    lines.push('')
  }

  // 找出跳出率最高的題目
  const worstStep = funnel
    .filter((s) => s.step < questions.length - 1)
    .sort((a, b) => b.dropOffRate - a.dropOffRate)[0]
  if (worstStep && worstStep.dropOff > 0) {
    lines.push(`⚠️ 最高跳出：第 ${worstStep.step + 1} 題「${worstStep.questionContent.slice(0, 20)}...」跳出 ${worstStep.dropOff} 人（${(worstStep.dropOffRate * 100).toFixed(1)}%）`)
    lines.push('')
  }

  lines.push(`— 毛行天下 Insight Engine 自動產出`)

  return lines.join('\n')
}

// ===== 題目統計 =====

export async function getQuestionStats(tenantId?: string, surveyId?: string): Promise<QuestionStats[]> {
  const questions = await resolveQuestions(tenantId, surveyId)

  const conds: string[] = []
  const params: unknown[] = []
  let idx = 1
  if (tenantId) { conds.push(`tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`response_id IN (SELECT id FROM responses WHERE survey_id = $${idx++})`); params.push(surveyId) }
  const answerWhere = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''

  const allAnswers = await query<{ question_key: string; value: unknown }>(
    `SELECT question_key, value FROM answers ${answerWhere}`, params
  )

  const answersByKey = new Map<string, { value: unknown }[]>()
  for (const row of allAnswers) {
    const existing = answersByKey.get(row.question_key) ?? []
    existing.push({ value: row.value })
    answersByKey.set(row.question_key, existing)
  }

  return questions.map((question) => {
    const answerRows = answersByKey.get(question.key) ?? []

    if (question.type === 'text') {
      const textResponses = answerRows
        .map((r) => (typeof r.value === 'string' ? r.value : ''))
        .filter(Boolean)

      return {
        questionKey: question.key,
        questionContent: question.content,
        questionType: question.type,
        distribution: [],
        textResponses,
      }
    }

    const countMap = new Map<string, number>()
    for (const row of answerRows) {
      const values = Array.isArray(row.value) ? row.value : [row.value]
      for (const v of values) {
        if (typeof v === 'string') {
          countMap.set(v, (countMap.get(v) ?? 0) + 1)
        }
      }
    }

    return {
      questionKey: question.key,
      questionContent: question.content,
      questionType: question.type,
      distribution: Array.from(countMap.entries()).map(([label, count]) => ({
        label,
        count,
      })),
    }
  })
}

// ===== 填答列表 =====

export interface ResponseListFilters {
  status?: string
  source?: string
}

export async function getResponseList(
  page: number,
  pageSize: number,
  filters?: ResponseListFilters,
  tenantId?: string,
  surveyId?: string,
): Promise<PaginatedResponse<ResponseListItem>> {
  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (tenantId) {
    conditions.push(`tenant_id = $${paramIdx++}`)
    params.push(tenantId)
  }
  if (surveyId) {
    conditions.push(`survey_id = $${paramIdx++}`)
    params.push(surveyId)
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`)
    params.push(filters.status)
  }
  if (filters?.source) {
    conditions.push(`utm_source = $${paramIdx++}`)
    params.push(filters.source)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [responses, totalRow] = await Promise.all([
    query<{
      id: string
      status: string
      source: string | null
      utm_source: string | null
      submitted_at: string
      created_at: string
      notes: string | null
    }>(
      `SELECT id, status, source, utm_source, submitted_at, created_at, notes
       FROM responses ${where}
       ORDER BY COALESCE(submitted_at, created_at) DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, pageSize, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM responses ${where}`,
      params
    ),
  ])

  if (responses.length === 0) return { data: [], total: 0, page, pageSize }

  const responseIds = responses.map((r) => r.id)
  const [tagRows, clickRows] = await Promise.all([
    query<{
      response_id: string
      tag_key: string
      tag_value: string
    }>(
      `SELECT response_id, tag_key, tag_value
       FROM user_tags
       WHERE response_id = ANY($1)`,
      [responseIds]
    ),
    query<{
      response_id: string
      event_type: string
      clicked_at: string
    }>(
      `SELECT response_id, event_type, clicked_at
       FROM click_events
       WHERE response_id = ANY($1)`,
      [responseIds]
    ),
  ])

  const tagMap = new Map<string, { key: string; value: string }[]>()
  for (const tag of tagRows) {
    const existing = tagMap.get(tag.response_id) ?? []
    existing.push({ key: tag.tag_key, value: tag.tag_value })
    tagMap.set(tag.response_id, existing)
  }

  const clickMap = new Map<string, { eventType: string; clickedAt: string }[]>()
  for (const c of clickRows) {
    const existing = clickMap.get(c.response_id) ?? []
    existing.push({ eventType: c.event_type, clickedAt: c.clicked_at })
    clickMap.set(c.response_id, existing)
  }

  const items: ResponseListItem[] = responses.map((r) => ({
    id: r.id,
    status: r.status,
    source: r.source,
    utmSource: r.utm_source,
    submittedAt: r.submitted_at,
    createdAt: r.created_at,
    notes: r.notes,
    tags: tagMap.get(r.id) ?? [],
    clickEvents: clickMap.get(r.id) ?? [],
  }))

  return { data: items, total: parseInt(totalRow?.count ?? '0', 10), page, pageSize }
}

// ===== 單筆填答 =====

export async function getResponseDetail(
  responseId: string
): Promise<ResponseDetail | null> {
  const response = await queryOne<{
    id: string
    status: string
    source: string | null
    utm_source: string | null
    submitted_at: string
    created_at: string
    notes: string | null
  }>(
    'SELECT id, status, source, utm_source, submitted_at, created_at, notes FROM responses WHERE id = $1',
    [responseId]
  )

  if (!response) return null

  const [answerRows, tagRows, clickRows] = await Promise.all([
    query<{ question_key: string; value: string | string[] }>(
      'SELECT question_key, value FROM answers WHERE response_id = $1',
      [responseId]
    ),
    query<{ tag_key: string; tag_value: string }>(
      'SELECT tag_key, tag_value FROM user_tags WHERE response_id = $1',
      [responseId]
    ),
    query<{ event_type: string; clicked_at: string }>(
      'SELECT event_type, clicked_at FROM click_events WHERE response_id = $1',
      [responseId]
    ),
  ])

  const questions = await resolveQuestions()
  const questionMap = new Map<string, string>()
  for (const q of questions) {
    questionMap.set(q.key, q.content)
  }

  return {
    id: response.id,
    status: response.status,
    source: response.source,
    utmSource: response.utm_source,
    submittedAt: response.submitted_at,
    createdAt: response.created_at,
    notes: response.notes ?? null,
    tags: tagRows.map((t) => ({
      key: t.tag_key,
      value: t.tag_value,
    })),
    clickEvents: clickRows.map((c) => ({
      eventType: c.event_type,
      clickedAt: c.clicked_at,
    })),
    answers: answerRows.map((a) => ({
      questionKey: a.question_key,
      questionContent: questionMap.get(a.question_key) ?? '',
      value: a.value,
    })),
  }
}

// ===== 標籤統計 =====

export async function getTagDistribution(tenantId?: string, surveyId?: string): Promise<TagDistribution[]> {
  const conds: string[] = []
  const params: unknown[] = []
  let idx = 1
  if (tenantId) { conds.push(`tenant_id = $${idx++}`); params.push(tenantId) }
  if (surveyId) { conds.push(`response_id IN (SELECT id FROM responses WHERE survey_id = $${idx++})`); params.push(surveyId) }
  const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''

  const rows = await query<{ tag_key: string; tag_value: string; count: string }>(
    `SELECT tag_key, tag_value, COUNT(*)::text AS count FROM user_tags ${where} GROUP BY tag_key, tag_value ORDER BY COUNT(*) DESC`,
    params
  )

  return rows.map((r) => ({
    tagKey: r.tag_key,
    tagValue: r.tag_value,
    count: parseInt(r.count, 10),
  }))
}

// ===== UTM 來源分析 =====

async function getUtmBreakdown(column: string, tenantId?: string, surveyId?: string): Promise<UtmSourceStats[]> {
  const allowedColumns = ['utm_source', 'utm_medium', 'utm_campaign']
  if (!allowedColumns.includes(column)) return []

  const { where, params } = buildWhere(tenantId, surveyId)
  const rows = await query<{ label: string; total: string; completed: string }>(
    `SELECT COALESCE(${column}, '(direct)') AS label, COUNT(*)::text AS total,
     COUNT(*) FILTER (WHERE status = 'completed')::text AS completed
     FROM responses ${where} GROUP BY ${column} ORDER BY COUNT(*) DESC`,
    params
  )

  return rows.map((r) => {
    const total = parseInt(r.total, 10)
    const completed = parseInt(r.completed, 10)
    return {
      source: r.label,
      total,
      completed,
      completionRate: total > 0 ? completed / total : 0,
    }
  })
}

export async function getUtmAnalytics(tenantId?: string, surveyId?: string): Promise<UtmAnalytics> {
  const [bySources, byMedium, byCampaign] = await Promise.all([
    getUtmBreakdown('utm_source', tenantId, surveyId),
    getUtmBreakdown('utm_medium', tenantId, surveyId),
    getUtmBreakdown('utm_campaign', tenantId, surveyId),
  ])
  return { bySources, byMedium, byCampaign }
}

// ===== CSV 匯出 =====

export async function getResponsesCsv(tenantId?: string, surveyId?: string): Promise<string> {
  const { where, params } = buildWhere(tenantId, surveyId)
  const responses = await query<{
      id: string; status: string; source: string | null
      utm_source: string | null; utm_medium: string | null; utm_campaign: string | null
      submitted_at: string | null; created_at: string
    }>(`SELECT id, status, source, utm_source, utm_medium, utm_campaign, submitted_at, created_at FROM responses ${where} ORDER BY created_at DESC`, params)

  if (responses.length === 0) return '\uFEFF'

  const responseIds = responses.map((r) => r.id)
  const [answers, tags] = await Promise.all([
    query<{ response_id: string; question_key: string; value: unknown }>(
      'SELECT response_id, question_key, value FROM answers WHERE response_id = ANY($1)', [responseIds]
    ),
    query<{ response_id: string; tag_key: string; tag_value: string }>(
      'SELECT response_id, tag_key, tag_value FROM user_tags WHERE response_id = ANY($1)', [responseIds]
    ),
  ])

  const answerMap = new Map<string, Map<string, string>>()
  for (const a of answers) {
    if (!answerMap.has(a.response_id)) answerMap.set(a.response_id, new Map())
    const raw = a.value
    const val = Array.isArray(raw)
      ? (raw as string[]).join('; ')
      : typeof raw === 'string'
        ? raw
        : String(raw ?? '')
    answerMap.get(a.response_id)!.set(a.question_key, val)
  }

  const tagMap = new Map<string, Map<string, string>>()
  for (const t of tags) {
    if (!tagMap.has(t.response_id)) tagMap.set(t.response_id, new Map())
    tagMap.get(t.response_id)!.set(t.tag_key, t.tag_value)
  }

  const questions = await resolveQuestions(tenantId, surveyId)
  const tagKeys = [...new Set(tags.map((t) => t.tag_key))].sort()

  const headers = [
    'id', 'status', 'source', 'utm_source', 'utm_medium', 'utm_campaign',
    'submitted_at', 'created_at',
    ...questions.map((q) => q.key),
    ...tagKeys.map((k) => `tag:${k}`),
  ]

  const csvRows = [headers.map(escapeCsv).join(',')]

  for (const r of responses) {
    const answerRow = answerMap.get(r.id) ?? new Map()
    const tagRow = tagMap.get(r.id) ?? new Map()

    const row = [
      r.id,
      r.status,
      r.source ?? '',
      r.utm_source ?? '',
      r.utm_medium ?? '',
      r.utm_campaign ?? '',
      r.submitted_at ?? '',
      r.created_at,
      ...questions.map((q) => answerRow.get(q.key) ?? ''),
      ...tagKeys.map((k) => tagRow.get(k) ?? ''),
    ]

    csvRows.push(row.map((v) => escapeCsv(String(v))).join(','))
  }

  // UTF-8 BOM 讓 Excel 正確辨識編碼
  return '\uFEFF' + csvRows.join('\n')
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * LINE Bot 對話式填答引擎
 * 狀態機：idle → in_progress → completed/abandoned
 */

import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, execute } from '@/lib/db'
import { getPrimarySurveySlug } from '@/lib/surveyRepo'
import { analyzeResponse } from '@/lib/analyzeResponse'
import { MVP_SURVEY_SLUG } from '@/constants'
import { getTenantBranding } from '@/lib/tenantBranding'

// ===== 型別 =====

export interface LineSurveySession {
  id: string
  lineUserId: string
  tenantId: string
  surveyId: string
  responseId: string
  currentStep: number
  route: string
  status: 'in_progress' | 'completed' | 'abandoned'
}

interface QuestionRow extends Record<string, unknown> {
  id: string
  key: string
  type: string
  content: string
  options: { label: string; value: string }[] | string
  is_required: boolean
  max_selections: number | null
  route: string
}

interface SurveyRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  branch_config: string | null
  slug: string
}

interface SessionRow extends Record<string, unknown> {
  id: string
  line_user_id: string
  tenant_id: string
  survey_id: string
  response_id: string
  current_step: number
  route: string
  status: string
}

export interface LineTextMessage {
  type: 'text'
  text: string
  quickReply?: {
    items: Array<{
      type: 'action'
      action: { type: 'message'; label: string; text: string }
    }>
  }
}

// ===== 常數 =====

const DEFAULT_TENANT = 'default'
const SKIP_KEYWORD = /^跳過$/

// ===== DB 操作（私有）=====

async function getPrimarySurvey(tenantId: string): Promise<SurveyRow | null> {
  const slug = (await getPrimarySurveySlug(tenantId)) ?? MVP_SURVEY_SLUG
  return queryOne<SurveyRow>(
    `SELECT id, tenant_id, branch_config, slug FROM surveys WHERE slug = $1 AND status = 'published'`,
    [slug]
  )
}

async function getQuestionsForRoute(surveyId: string, route: string): Promise<QuestionRow[]> {
  const sql = route === 'all'
    ? `SELECT * FROM questions WHERE survey_id = $1 AND route = 'all' ORDER BY order_index ASC`
    : `SELECT * FROM questions WHERE survey_id = $1 AND route IN ('all', $2) ORDER BY order_index ASC`
  const params = route === 'all' ? [surveyId] : [surveyId, route]
  return query<QuestionRow>(sql, params)
}

async function createSession(
  lineUserId: string,
  surveyId: string,
  responseId: string,
  tenantId: string
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO line_survey_sessions (line_user_id, tenant_id, survey_id, response_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [lineUserId, tenantId, surveyId, responseId]
  )
  return row!.id
}

async function createResponse(surveyId: string, tenantId: string, lineUserId: string): Promise<string> {
  const responseId = uuidv4()
  await execute(
    `INSERT INTO responses (id, session_id, survey_id, status, source, utm_source, tenant_id, started_at)
     VALUES ($1, $2, $3, 'in_progress', 'line', 'line', $4, NOW())`,
    [responseId, uuidv4(), surveyId, tenantId]
  )
  await execute(
    `INSERT INTO line_users (line_user_id, response_id)
     VALUES ($1, $2)
     ON CONFLICT (line_user_id) DO UPDATE SET response_id = $2`,
    [lineUserId, responseId]
  )
  return responseId
}

async function saveAnswer(
  responseId: string,
  questionKey: string,
  value: unknown,
  tenantId: string
): Promise<void> {
  await execute(
    `INSERT INTO answers (id, response_id, question_key, value, tenant_id)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
    [responseId, questionKey, JSON.stringify(value), tenantId]
  )
}

async function advanceSession(sessionId: string, step: number, route: string): Promise<void> {
  await execute(
    `UPDATE line_survey_sessions
     SET current_step = $1, route = $2, updated_at = NOW()
     WHERE id = $3`,
    [step, route, sessionId]
  )
}

async function finalizeSession(session: LineSurveySession, totalSteps: number): Promise<void> {
  await execute(
    `UPDATE line_survey_sessions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [session.id]
  )
  await execute(
    `UPDATE responses SET status = 'completed', last_step = $1, route = $2, submitted_at = NOW()
     WHERE id = $3`,
    [totalSteps, session.route === 'all' ? null : session.route, session.responseId]
  )

  // 非阻塞：打標籤
  const answerRows = await query<{ question_key: string; value: string | string[] }>(
    `SELECT question_key, value FROM answers WHERE response_id = $1`,
    [session.responseId]
  )
  const answers = answerRows.map((r) => ({ questionKey: r.question_key, value: r.value }))
  analyzeResponse(answers, session.surveyId)
    .then(async (tags) => {
      for (const t of tags) {
        await execute(
          `INSERT INTO user_tags (id, response_id, tag_key, tag_value, tenant_id)
           VALUES (gen_random_uuid(), $1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [session.responseId, t.key, t.value, session.tenantId]
        )
      }
    })
    .catch(() => {})
}

function sessionFromRow(row: SessionRow): LineSurveySession {
  return {
    id: row.id,
    lineUserId: row.line_user_id,
    tenantId: row.tenant_id,
    surveyId: row.survey_id,
    responseId: row.response_id,
    currentStep: row.current_step,
    route: row.route,
    status: row.status as LineSurveySession['status'],
  }
}

// ===== 答案解析（私有）=====

function parseOptions(raw: QuestionRow['options']): { label: string; value: string }[] {
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw as string) } catch { return [] }
}

function parseChoiceAnswer(
  text: string,
  options: { label: string; value: string }[],
  maxSelections: number | null
): string | string[] | null {
  const indices = text.split(',').map((s) => parseInt(s.trim(), 10) - 1)
  if (indices.some((i) => isNaN(i) || i < 0 || i >= options.length)) return null
  if (maxSelections !== null && indices.length > maxSelections) return null
  const values = indices.map((i) => options[i].value)
  return values.length === 1 && maxSelections !== 1 ? values[0] : values
}

function parseAnswerInput(
  text: string,
  row: QuestionRow
): { value: unknown } | null {
  const trimmed = text.trim()
  if (row.type === 'text') return { value: trimmed }

  const options = parseOptions(row.options)
  const parsed = parseChoiceAnswer(
    trimmed,
    options,
    row.type === 'multiple' ? (row.max_selections ?? null) : 1
  )
  return parsed !== null ? { value: parsed } : null
}

// ===== 分流偵測（私有）=====

function detectRouteChange(
  branchConfigRaw: string | null,
  questionKey: string,
  answer: unknown
): string | null {
  if (!branchConfigRaw) return null

  let config: { branchKey?: string; routes?: Record<string, string[]> } | null = null
  try { config = JSON.parse(branchConfigRaw) } catch { return null }
  if (!config?.branchKey || config.branchKey !== questionKey) return null

  const trigger = Array.isArray(answer) ? answer[0] : String(answer)
  for (const [route, triggers] of Object.entries(config.routes ?? {})) {
    if (triggers.includes(trigger)) return route
  }
  return null
}

// ===== 訊息建構（私有）=====

function buildQuestionMessage(row: QuestionRow, step: number, total: number): LineTextMessage {
  const lines: string[] = [`[${step + 1}/${total}] ${row.content}`]
  if (!row.is_required) lines.push('（選填，可輸入「跳過」）')

  const options = parseOptions(row.options)

  if (row.type !== 'text') {
    lines.push('')
    if (row.type === 'multiple') {
      const maxHint = row.max_selections ? `最多 ${row.max_selections} 個，` : ''
      lines.push(`（多選，${maxHint}用逗號分隔，例如：1,3）`)
    }
    options.forEach((opt, i) => lines.push(`${i + 1}. ${opt.label}`))
  }

  lines.push('\n輸入「離開」可結束填答')

  const isQuickReply = row.type === 'single' && options.length > 0 && options.length <= 10
  if (isQuickReply) {
    return {
      type: 'text',
      text: lines.join('\n'),
      quickReply: {
        items: options.map((_, i) => ({
          type: 'action' as const,
          action: { type: 'message' as const, label: `${i + 1}`, text: `${i + 1}` },
        })),
      },
    }
  }

  return { type: 'text', text: lines.join('\n') }
}

async function buildCompletionMessage(tenantId: string): Promise<LineTextMessage> {
  const { completionMsg } = await getTenantBranding(tenantId)
  return { type: 'text', text: completionMsg }
}

function buildInvalidAnswerMessage(row: QuestionRow): LineTextMessage {
  const options = parseOptions(row.options)
  const hint = options.length > 0
    ? `請輸入 1 到 ${options.length} 之間的數字`
    : '請輸入你的回覆'
  return { type: 'text', text: `⚠️ 輸入格式不正確，${hint}\n\n輸入「離開」可結束填答` }
}

// ===== 公開 API =====

/** 取得使用者的活躍 session（若有） */
export async function getActiveSession(lineUserId: string): Promise<LineSurveySession | null> {
  const row = await queryOne<SessionRow>(
    `SELECT * FROM line_survey_sessions
     WHERE line_user_id = $1 AND status = 'in_progress'
     ORDER BY created_at DESC LIMIT 1`,
    [lineUserId]
  )
  return row ? sessionFromRow(row) : null
}

/** 開始新的 LINE 對話式填答（取主問卷 → 建 response → 建 session → 回傳第一題） */
export async function startSurveySession(
  lineUserId: string,
  tenantId = DEFAULT_TENANT
): Promise<LineTextMessage[]> {
  const survey = await getPrimarySurvey(tenantId)
  if (!survey) {
    return [{ type: 'text', text: '目前尚無可填答的問卷，請稍後再試。' }]
  }

  const questions = await getQuestionsForRoute(survey.id, 'all')
  if (questions.length === 0) {
    return [{ type: 'text', text: '問卷尚未設定題目，請稍後再試。' }]
  }

  const responseId = await createResponse(survey.id, survey.tenant_id, lineUserId)
  await createSession(lineUserId, survey.id, responseId, survey.tenant_id)

  return [
    { type: 'text', text: `📋 開始填答問卷！\n共 ${questions.length} 題，填完可加入封測名單 💛\n\n輸入「離開」可隨時中止` },
    buildQuestionMessage(questions[0], 0, questions.length),
  ]
}

/** 處理使用者在填答中的訊息 */
export async function processUserAnswer(
  session: LineSurveySession,
  text: string
): Promise<LineTextMessage[]> {
  const questions = await getQuestionsForRoute(session.surveyId, session.route)
  const currentQuestion = questions[session.currentStep]

  if (!currentQuestion) {
    await finalizeSession(session, questions.length)
    return [await buildCompletionMessage(session.tenantId)]
  }

  // 選填題允許跳過
  const isSkip = SKIP_KEYWORD.test(text.trim()) && !currentQuestion.is_required
  let nextRoute = session.route

  if (!isSkip) {
    const parsed = parseAnswerInput(text, currentQuestion)
    if (parsed === null) return [buildInvalidAnswerMessage(currentQuestion)]

    await saveAnswer(session.responseId, currentQuestion.key, parsed.value, session.tenantId)

    const survey = await queryOne<{ branch_config: string | null }>(
      `SELECT branch_config FROM surveys WHERE id = $1`,
      [session.surveyId]
    )
    nextRoute = detectRouteChange(survey?.branch_config ?? null, currentQuestion.key, parsed.value) ?? session.route
  }

  const nextStep = session.currentStep + 1
  const nextQuestions = await getQuestionsForRoute(session.surveyId, nextRoute)

  if (nextStep >= nextQuestions.length) {
    await finalizeSession({ ...session, route: nextRoute }, nextStep)
    return [await buildCompletionMessage(session.tenantId)]
  }

  await advanceSession(session.id, nextStep, nextRoute)
  return [buildQuestionMessage(nextQuestions[nextStep], nextStep, nextQuestions.length)]
}

/** 中止填答 */
export async function abandonSession(sessionId: string): Promise<void> {
  await execute(
    `UPDATE line_survey_sessions SET status = 'abandoned', updated_at = NOW() WHERE id = $1`,
    [sessionId]
  )
}

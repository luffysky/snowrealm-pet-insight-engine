import { query, queryOne, execute } from './db'
import type { Question, SurveyConfig, QuestionOption, BranchConfig, DoneConfig } from '@/types'

// ===== DB Row 型別 =====

interface SurveyRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  status: string
  subtitle: string
  cover_title: string
  cover_subtitle: string
  start_button_text: string
  done_title: string
  done_subtitle: string
  variant_group: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  branch_config: string | null
  done_config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface QuestionRow extends Record<string, unknown> {
  id: string
  survey_id: string
  key: string
  type: string
  content: string
  options: QuestionOption[] | string
  order_index: number
  is_required: boolean
  max_selections: number | null
  route: string | null
  chapter: string | null
  emoji: string | null
  narrative: string | null
  allow_other_text: boolean | null
  created_at: string
}

// ===== 讀取 =====

/** 依 slug 取得已發布的問卷（含題目），回傳 SurveyConfig 格式 */
export async function getSurveyConfigBySlug(slug: string): Promise<SurveyConfig | null> {
  const survey = await queryOne<SurveyRow>(
    `SELECT * FROM surveys WHERE slug = $1 AND status = 'published'`,
    [slug]
  )
  if (!survey) return null

  // 排程檢查
  const now = new Date()
  if (survey.scheduled_start && new Date(survey.scheduled_start as unknown as string) > now) return null
  if (survey.scheduled_end && new Date(survey.scheduled_end as unknown as string) < now) return null

  const rows = await query<QuestionRow>(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC`,
    [survey.id]
  )

  return toSurveyConfig(survey, rows)
}

/** A/B：找到同 variant_group 的其他已發布問卷，隨機挑一個 */
export async function getRandomVariant(slug: string): Promise<SurveyConfig | null> {
  const survey = await queryOne<SurveyRow>(
    `SELECT * FROM surveys WHERE slug = $1`,
    [slug]
  )
  if (!survey || !survey.variant_group) return getSurveyConfigBySlug(slug)

  const variants = await query<SurveyRow>(
    `SELECT * FROM surveys WHERE variant_group = $1 AND status = 'published'`,
    [survey.variant_group]
  )
  if (variants.length === 0) return null

  const picked = variants[Math.floor(Math.random() * variants.length)]
  const rows = await query<QuestionRow>(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC`,
    [picked.id]
  )
  return toSurveyConfig(picked, rows)
}

/** 取得 variant group 內所有問卷的比較統計 */
export async function getVariantGroupStats(variantGroup: string, tenantId?: string) {
  const surveys = await query<SurveyRow>(
    tenantId
      ? `SELECT * FROM surveys WHERE variant_group = $1 AND tenant_id = $2`
      : `SELECT * FROM surveys WHERE variant_group = $1`,
    tenantId ? [variantGroup, tenantId] : [variantGroup]
  )

  const results = []
  for (const s of surveys) {
    const row = await queryOne<{ total: string; completed: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status = 'completed')::text AS completed
       FROM responses WHERE survey_id = $1`,
      [s.id]
    )
    const total = parseInt(row?.total ?? '0', 10)
    const completed = parseInt(row?.completed ?? '0', 10)
    results.push({
      surveyId: s.id,
      slug: s.slug,
      title: s.title,
      total,
      completed,
      completionRate: total > 0 ? completed / total : 0,
    })
  }
  return results
}

/** 列出所有 variant group 名稱 */
export async function listVariantGroups(tenantId?: string): Promise<string[]> {
  const rows = await query<{ variant_group: string }>(
    tenantId
      ? `SELECT DISTINCT variant_group FROM surveys WHERE variant_group IS NOT NULL AND tenant_id = $1 ORDER BY variant_group`
      : `SELECT DISTINCT variant_group FROM surveys WHERE variant_group IS NOT NULL ORDER BY variant_group`,
    tenantId ? [tenantId] : []
  )
  return rows.map((r) => r.variant_group)
}

/** 取得所有問卷（admin 列表用） */
export async function listSurveys(tenantId?: string): Promise<SurveyRow[]> {
  if (tenantId) {
    return query<SurveyRow>(`SELECT * FROM surveys WHERE tenant_id = $1 ORDER BY display_order ASC, created_at DESC`, [tenantId])
  }
  return query<SurveyRow>(`SELECT * FROM surveys ORDER BY display_order ASC, created_at DESC`)
}

/** 取得租戶的主問卷 slug */
export async function getPrimarySurveySlug(tenantId: string): Promise<string | null> {
  const row = await queryOne<{ slug: string }>(
    `SELECT slug FROM surveys WHERE tenant_id = $1 AND is_primary = true AND status = 'published' LIMIT 1`,
    [tenantId]
  )
  return row?.slug ?? null
}

/** 設定某問卷為該租戶的主問卷（同時取消其他主問卷） */
export async function setPrimarySurvey(surveyId: string, tenantId: string): Promise<void> {
  await execute(`UPDATE surveys SET is_primary = false WHERE tenant_id = $1`, [tenantId])
  await execute(`UPDATE surveys SET is_primary = true WHERE id = $1 AND tenant_id = $2`, [surveyId, tenantId])
}

/** 新增問卷 */
export async function createSurvey(data: {
  title: string
  slug: string
  tenantId?: string
}): Promise<SurveyRow> {
  // 預設 published：公開路徑 /{tenant}/{slug} 與 GET /api/surveys/[slug] 皆只開放已發布問卷。
  // 若需先隱藏，請在後台將狀態改為 draft。
  const row = await queryOne<SurveyRow>(
    `INSERT INTO surveys (id, title, slug, status, subtitle, cover_title, cover_subtitle, start_button_text, done_title, done_subtitle, tenant_id)
     VALUES (gen_random_uuid(), $1, $2, 'published', '', $1, '', '開始填寫', '感謝您的填寫！', '您的回覆已成功送出', $3)
     RETURNING *`,
    [data.title, data.slug, data.tenantId ?? 'default']
  )
  return row!
}

/** 依 ID 取得問卷 */
export async function getSurveyById(id: string): Promise<SurveyRow | null> {
  return queryOne<SurveyRow>(`SELECT * FROM surveys WHERE id = $1`, [id])
}

/** 刪除問卷（連帶刪除標籤、點擊事件、答案、填答紀錄與題目） */
export async function deleteSurvey(id: string): Promise<boolean> {
  const survey = await getSurveyById(id)
  if (!survey) return false

  // 若資料庫未設定 ON DELETE CASCADE，手動清除相依聯結資料以防 foreign key 錯誤
  await execute('DELETE FROM user_tags WHERE response_id IN (SELECT id FROM responses WHERE survey_id = $1)', [id])
  await execute('DELETE FROM click_events WHERE response_id IN (SELECT id FROM responses WHERE survey_id = $1)', [id])
  await execute('DELETE FROM answers WHERE response_id IN (SELECT id FROM responses WHERE survey_id = $1)', [id])
  await execute('DELETE FROM responses WHERE survey_id = $1', [id])
  await execute('DELETE FROM questions WHERE survey_id = $1', [id])
  await execute('DELETE FROM survey_theme_settings WHERE survey_slug = $1', [survey.slug])
  await execute('DELETE FROM surveys WHERE id = $1', [id])

  return true
}

/** 重新排序問卷（更新 display_order） */
export async function reorderSurveys(orderedIds: string[], tenantId: string): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await execute(
      `UPDATE surveys SET display_order = $1 WHERE id = $2 AND tenant_id = $3`,
      [i, orderedIds[i], tenantId]
    )
  }
}

/** 依 survey_id 取得題目，可依 route 過濾（預設全部） */
export async function getQuestionsBySurveyId(surveyId: string, route?: string): Promise<QuestionRow[]> {
  if (route) {
    return query<QuestionRow>(
      `SELECT * FROM questions WHERE survey_id = $1 AND route IN ('all', $2) ORDER BY order_index ASC`,
      [surveyId, route]
    )
  }
  return query<QuestionRow>(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC`,
    [surveyId]
  )
}

/** 取得所有題目（依 slug，用於 stats 等） */
export async function getQuestionsBySlug(slug: string): Promise<Question[]> {
  const survey = await queryOne<SurveyRow>(
    `SELECT id FROM surveys WHERE slug = $1`,
    [slug]
  )
  if (!survey) return []

  const rows = await query<QuestionRow>(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC`,
    [survey.id]
  )

  return rows.map(toQuestion)
}

// ===== 更新問卷 =====

export async function updateSurvey(
  id: string,
  data: Partial<{
    title: string
    slug: string
    subtitle: string
    status: string
    cover_title: string
    cover_subtitle: string
    start_button_text: string
    done_title: string
    done_subtitle: string
    variant_group: string | null
    scheduled_start: string | null
    scheduled_end: string | null
    branch_config: Record<string, unknown> | null
    og_title: string | null
    og_description: string | null
    og_image_url: string | null
    done_config: Record<string, unknown> | null
  }>
): Promise<number> {
  const allowed = [
    'title', 'slug', 'subtitle', 'status',
    'cover_title', 'cover_subtitle', 'start_button_text',
    'done_title', 'done_subtitle',
    'variant_group', 'scheduled_start', 'scheduled_end',
    'branch_config', 'done_config',
    'og_title', 'og_description', 'og_image_url',
  ]
  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  for (const key of allowed) {
    if (key in data) {
      const val = (key === 'branch_config' || key === 'done_config')
        ? (data[key as keyof typeof data] ? JSON.stringify(data[key as keyof typeof data]) : null)
        : data[key as keyof typeof data]
      sets.push(`${key} = $${idx++}`)
      params.push(val)
    }
  }

  if (sets.length === 0) return 0

  sets.push(`updated_at = NOW()`)
  params.push(id)

  return execute(
    `UPDATE surveys SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  )
}

// ===== 題目 CRUD =====

export async function createQuestion(data: {
  survey_id: string
  key: string
  type: string
  content: string
  options: QuestionOption[]
  order_index: number
  is_required: boolean
  max_selections: number | null
  route?: string
  chapter?: string
  emoji?: string
  narrative?: string
  allow_other_text?: boolean
}): Promise<QuestionRow> {
  const row = await queryOne<QuestionRow>(
    `INSERT INTO questions (id, survey_id, key, type, content, options, order_index, is_required, max_selections, route, chapter, emoji, narrative, allow_other_text)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      data.survey_id,
      data.key,
      data.type,
      data.content,
      JSON.stringify(data.options),
      data.order_index,
      data.is_required,
      data.max_selections,
      data.route ?? 'all',
      data.chapter ?? null,
      data.emoji ?? null,
      data.narrative ?? null,
      data.allow_other_text ?? false,
    ]
  )
  return row!
}

export async function updateQuestion(
  id: string,
  data: Partial<{
    key: string
    type: string
    content: string
    options: QuestionOption[]
    order_index: number
    is_required: boolean
    max_selections: number | null
  }>
): Promise<number> {
  const allowed = ['key', 'type', 'content', 'options', 'order_index', 'is_required', 'max_selections', 'route', 'chapter', 'emoji', 'narrative', 'allow_other_text']
  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  for (const key of allowed) {
    if (key in data) {
      const val = key === 'options' ? JSON.stringify(data.options) : data[key as keyof typeof data]
      sets.push(`${key} = $${idx++}`)
      params.push(val)
    }
  }

  if (sets.length === 0) return 0

  params.push(id)
  return execute(
    `UPDATE questions SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  )
}

export async function deleteQuestion(id: string): Promise<number> {
  return execute(`DELETE FROM questions WHERE id = $1`, [id])
}

export async function reorderQuestions(
  surveyId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await execute(
      `UPDATE questions SET order_index = $1 WHERE id = $2 AND survey_id = $3`,
      [i, orderedIds[i], surveyId]
    )
  }
}

// ===== 轉換工具 =====

function parseOptions(raw: QuestionOption[] | string): QuestionOption[] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as QuestionOption[] } catch { return [] }
  }
  return raw
}

export function toQuestion(row: QuestionRow): Question {
  return {
    key: row.key,
    type: row.type as Question['type'],
    content: row.content,
    options: parseOptions(row.options),
    isRequired: row.is_required,
    ...(row.max_selections ? { maxSelections: row.max_selections } : {}),
    route: row.route ?? 'all',
    ...(row.chapter ? { chapter: row.chapter } : {}),
    ...(row.emoji ? { emoji: row.emoji } : {}),
    ...(row.narrative ? { narrative: row.narrative } : {}),
    ...(row.allow_other_text ? { allowOtherText: true } : {}),
  }
}

function parseBranchConfig(raw: string | null): BranchConfig | undefined {
  if (!raw) return undefined
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    // 物件格式：{ branchKey, routes }
    if (parsed && parsed.branchKey && parsed.routes) return parsed
    // 陣列格式：[{ branchKey, routes, id? }]（Cursor 可能存成這種）
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].branchKey && parsed[0].routes) {
      return parsed as BranchConfig
    }
    return undefined
  } catch { return undefined }
}

function toSurveyConfig(survey: SurveyRow, questions: QuestionRow[]): SurveyConfig {
  return {
    slug: survey.slug,
    title: survey.title,
    subtitle: survey.subtitle,
    coverTitle: survey.cover_title,
    coverSubtitle: survey.cover_subtitle,
    startButtonText: survey.start_button_text,
    doneTitle: survey.done_title,
    doneSubtitle: survey.done_subtitle,
    questions: questions.map(toQuestion),
    branchConfig: parseBranchConfig(survey.branch_config),
    doneConfig: survey.done_config ? (survey.done_config as unknown as DoneConfig) : undefined,
  }
}

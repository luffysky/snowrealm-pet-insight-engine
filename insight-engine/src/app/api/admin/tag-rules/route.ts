import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'

interface TagRuleRow {
  [key: string]: unknown
  id: string
  survey_id: string
  question_key: string
  answer_value: string | null
  match_mode: string
  tag_key: string
  tag_value: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/** GET /api/admin/tag-rules — 取得所有標籤規則 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const surveyId = req.nextUrl.searchParams.get('surveyId')

  let sql = 'SELECT * FROM tag_rules'
  const params: unknown[] = []

  if (surveyId) {
    sql += ' WHERE survey_id = $1'
    params.push(surveyId)
  }

  sql += ' ORDER BY question_key, priority DESC, created_at'

  const rows = await query<TagRuleRow>(sql, params)
  return NextResponse.json(rows)
}

/** POST /api/admin/tag-rules — 新增規則 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    surveyId: string
    questionKey: string
    answerValue?: string
    matchMode: string
    tagKey: string
    tagValue: string
    priority?: number
  }

  if (!body.surveyId || !body.questionKey || !body.tagKey || !body.tagValue) {
    return NextResponse.json({ error: '必填欄位不可為空' }, { status: 400 })
  }

  if (!['exact', 'contains', 'any'].includes(body.matchMode)) {
    return NextResponse.json({ error: '無效的匹配模式' }, { status: 400 })
  }

  const rows = await query<TagRuleRow>(
    `INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      body.surveyId,
      body.questionKey.trim(),
      body.answerValue?.trim() ?? null,
      body.matchMode,
      body.tagKey.trim(),
      body.tagValue.trim(),
      body.priority ?? 0,
    ]
  )

  return NextResponse.json(rows[0], { status: 201 })
}

/** PUT /api/admin/tag-rules — 更新規則 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    id: string
    questionKey?: string
    answerValue?: string | null
    matchMode?: string
    tagKey?: string
    tagValue?: string
    priority?: number
    isActive?: boolean
  }

  if (!body.id) {
    return NextResponse.json({ error: '缺少規則 ID' }, { status: 400 })
  }

  if (body.matchMode && !['exact', 'contains', 'any'].includes(body.matchMode)) {
    return NextResponse.json({ error: '無效的匹配模式' }, { status: 400 })
  }

  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (body.questionKey !== undefined) { sets.push(`question_key = $${idx++}`); params.push(body.questionKey.trim()) }
  if (body.answerValue !== undefined) { sets.push(`answer_value = $${idx++}`); params.push(body.answerValue === null ? null : body.answerValue.trim()) }
  if (body.matchMode !== undefined) { sets.push(`match_mode = $${idx++}`); params.push(body.matchMode) }
  if (body.tagKey !== undefined) { sets.push(`tag_key = $${idx++}`); params.push(body.tagKey.trim()) }
  if (body.tagValue !== undefined) { sets.push(`tag_value = $${idx++}`); params.push(body.tagValue.trim()) }
  if (body.priority !== undefined) { sets.push(`priority = $${idx++}`); params.push(body.priority) }
  if (body.isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(body.isActive) }

  if (sets.length === 0) {
    return NextResponse.json({ error: '沒有要更新的欄位' }, { status: 400 })
  }

  sets.push(`updated_at = NOW()`)
  params.push(body.id)

  const rows = await query<TagRuleRow>(
    `UPDATE tag_rules SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: '規則不存在' }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

/** DELETE /api/admin/tag-rules — 刪除規則 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: '缺少規則 ID' }, { status: 400 })
  }

  await execute('DELETE FROM tag_rules WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}

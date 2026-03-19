import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '@/lib/db'
import { analyzeResponse } from '@/lib/analyzeResponse'
import { MVP_SURVEY } from '@/lib/surveyConfig'
import { fireWebhooks } from '@/lib/webhook'
import { notifySurveySubmitted } from '@/lib/line'
import type { SubmitSurveyPayload } from '@/types'

const MAX_ANSWER_LENGTH = 2000
const MAX_ANSWERS_COUNT = 20

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await parseRequestBody(request)
  if (!body) {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })
  }

  const validationError = validatePayload(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  // 驗證 slug 是否存在於 DB 或 fallback config
  const slugExists = await queryOne<{ id: string }>(
    `SELECT id FROM surveys WHERE slug = $1`,
    [body.surveySlug]
  )
  if (!slugExists && body.surveySlug !== MVP_SURVEY.slug) {
    return NextResponse.json({ error: '問卷不存在' }, { status: 400 })
  }

  try {
    // 若有 progress response，複用它；否則建立新的
    const responseId = body.progressResponseId ?? uuidv4()
    const fingerprint = body.fingerprint ?? null

    if (body.progressResponseId) {
      // 更新既有的 in_progress response → completed
      await query(
        `UPDATE responses SET
          status = 'completed',
          source = $1, utm_source = $2, utm_medium = $3, utm_campaign = $4,
          fingerprint = COALESCE(fingerprint, $5),
          last_step = $6,
          submitted_at = NOW()
         WHERE id = $7`,
        [
          body.utm?.source ?? null,
          body.utm?.source ?? null,
          body.utm?.medium ?? null,
          body.utm?.campaign ?? null,
          fingerprint,
          body.answers.length,
          responseId,
        ]
      )
    } else {
      const sessionId = uuidv4()
      await query(
        `INSERT INTO responses (id, session_id, status, source, utm_source, utm_medium, utm_campaign, fingerprint, last_step, started_at, submitted_at)
         VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          responseId,
          sessionId,
          body.utm?.source ?? null,
          body.utm?.source ?? null,
          body.utm?.medium ?? null,
          body.utm?.campaign ?? null,
          fingerprint,
          body.answers.length,
        ]
      )
    }

    // Insert answers
    for (const a of body.answers) {
      await query(
        `INSERT INTO answers (id, response_id, question_key, value) VALUES ($1, $2, $3, $4)`,
        [uuidv4(), responseId, a.questionKey, JSON.stringify(a.value)]
      )
    }

    // Analyze & insert tags
    const tags = analyzeResponse(body.answers)
    for (const t of tags) {
      await query(
        `INSERT INTO user_tags (id, response_id, tag_key, tag_value) VALUES ($1, $2, $3, $4)`,
        [uuidv4(), responseId, t.key, t.value]
      )
    }

    // Fire webhooks (non-blocking)
    fireWebhooks('survey.submitted', {
      responseId,
      surveySlug: body.surveySlug,
      answersCount: body.answers.length,
    })

    // LINE 推播通知
    notifySurveySubmitted({
      responseId,
      surveySlug: body.surveySlug,
      answersCount: body.answers.length,
    })

    return NextResponse.json({ success: true, responseId })
  } catch (error) {
    console.error('[submit] DB error:', error)
    return NextResponse.json({ error: '儲存失敗，請稍後再試' }, { status: 500 })
  }
}

// ----- 輔助函式 -----

async function parseRequestBody(
  request: NextRequest
): Promise<SubmitSurveyPayload | null> {
  try {
    return (await request.json()) as SubmitSurveyPayload
  } catch {
    return null
  }
}

function validatePayload(body: SubmitSurveyPayload): string | null {
  // slug 驗證改為非同步 (validatePayloadAsync)，這裡只做格式驗證
  if (!body.surveySlug) {
    return '問卷不存在'
  }

  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return '答案不得為空'
  }

  if (body.answers.length > MAX_ANSWERS_COUNT) {
    return '答案數量超過限制'
  }

  for (const answer of body.answers) {
    if (!answer.questionKey || answer.value === undefined) {
      return '答案格式不正確'
    }

    if (typeof answer.value === 'string' && answer.value.length > MAX_ANSWER_LENGTH) {
      return '單筆答案長度超過限制'
    }

    if (Array.isArray(answer.value)) {
      for (const v of answer.value) {
        if (typeof v !== 'string' || v.length > MAX_ANSWER_LENGTH) {
          return '答案格式不正確'
        }
      }
    }
  }

  return null
}

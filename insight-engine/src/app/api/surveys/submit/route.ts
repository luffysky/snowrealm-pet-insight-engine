import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, execute } from '@/lib/db'
import { analyzeResponse } from '@/lib/analyzeResponse'
import { MVP_SURVEY } from '@/lib/surveyConfig'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { fireWebhooks } from '@/lib/webhook'
import { notifySurveySubmitted } from '@/lib/line'
import { verifyLineToken } from '@/lib/lineToken'
import { evaluateNotificationRules } from '@/lib/notificationEngine'
import { checkResponseLimit } from '@/lib/planLimits'
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
  const slugExists = await queryOne<{ id: string; tenant_id: string }>(
    `SELECT id, tenant_id FROM surveys WHERE slug = $1`,
    [body.surveySlug]
  )
  if (!slugExists && body.surveySlug !== MVP_SURVEY.slug) {
    return NextResponse.json({ error: '問卷不存在' }, { status: 400 })
  }

  const tenantId = slugExists?.tenant_id ?? 'maoxingtianxia'

  // 方案額度檢查
  const responseLimit = await checkResponseLimit(tenantId)
  if (!responseLimit.allowed) {
    return NextResponse.json(
      { error: '本月回覆數已達方案上限，請聯繫管理員升級方案', upgrade: true },
      { status: 403 }
    )
  }

  try {
    // 若有 progress response，複用它；否則建立新的
    const responseId = body.progressResponseId ?? uuidv4()
    const fingerprint = body.fingerprint ?? null
    const route = body.route ?? null

    // 查詢 survey_id
    const surveyId = slugExists?.id ?? null

    // 解析是否登入，如有則紀錄 user_id
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value
    let userId: string | null = null
    if (token) {
      const payload = await verifyToken(token)
      if (payload) userId = payload.sub
    }

    if (body.progressResponseId) {
      // 更新既有的 in_progress response → completed
      await query(
        `UPDATE responses SET
          status = 'completed',
          survey_id = COALESCE(survey_id, $1),
          source = $2, utm_source = $3, utm_medium = $4, utm_campaign = $5,
          fingerprint = COALESCE(fingerprint, $6),
          last_step = $7,
          route = $8,
          tenant_id = $10,
          user_id = COALESCE(user_id, $11),
          submitted_at = NOW()
         WHERE id = $9`,
        [
          surveyId,
          body.utm?.source ?? null,
          body.utm?.source ?? null,
          body.utm?.medium ?? null,
          body.utm?.campaign ?? null,
          fingerprint,
          body.answers.length,
          route,
          responseId,
          tenantId,
          userId,
        ]
      )
    } else {
      const sessionId = uuidv4()
      await query(
        `INSERT INTO responses (id, session_id, survey_id, status, source, utm_source, utm_medium, utm_campaign, fingerprint, last_step, route, tenant_id, user_id, started_at, submitted_at)
         VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          responseId,
          sessionId,
          surveyId,
          body.utm?.source ?? null,
          body.utm?.source ?? null,
          body.utm?.medium ?? null,
          body.utm?.campaign ?? null,
          fingerprint,
          body.answers.length,
          route,
          tenantId,
          userId,
        ]
      )
    }

    // Insert answers
    for (const a of body.answers) {
      await query(
        `INSERT INTO answers (id, response_id, question_key, value, tenant_id) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), responseId, a.questionKey, JSON.stringify(a.value), tenantId]
      )
    }

    // Analyze & insert tags
    const tags = await analyzeResponse(body.answers, surveyId ?? undefined)
    for (const t of tags) {
      await query(
        `INSERT INTO user_tags (id, response_id, tag_key, tag_value, tenant_id) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), responseId, t.key, t.value, tenantId]
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

    // LINE 身份綁定（從簽名連結來的使用者）
    let lineUserId: string | undefined
    if (body.lineToken) {
      lineUserId = verifyLineToken(body.lineToken) ?? undefined
      if (lineUserId) {
        await execute(
          `INSERT INTO line_users (line_user_id, response_id)
           VALUES ($1, $2)
           ON CONFLICT (line_user_id) DO UPDATE SET response_id = $2`,
          [lineUserId, responseId]
        )
      }
    }

    // 條件觸發通知（非阻塞）
    evaluateNotificationRules({
      responseId,
      surveySlug: body.surveySlug,
      surveyId: slugExists?.id,
      tags,
      lineUserId,
    }).catch(() => {})

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

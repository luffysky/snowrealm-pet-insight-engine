import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { generateGapSnapshot } from '@/lib/cognitiveGapEngine'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

interface SurveyRow extends Record<string, unknown> {
  id: string
  tenant_id: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 取用戶 JWT（自評者）
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    let userId: string | null = null
    if (token) {
      try {
        const payload = await verifyToken(token)
        userId = payload?.sub ?? null
      } catch {}
    }

    const body = await request.json() as {
      surveySlug: string
      responseId: string
      answers: Record<string, number>  // traitKey -> score (0-100)
      targetUserId?: string             // 他評時：被評對象
      isExternal?: boolean
    }

    if (!body.surveySlug || !body.responseId || !body.answers) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const survey = await queryOne<SurveyRow>(
      `SELECT id, tenant_id FROM surveys WHERE slug = $1`, [body.surveySlug]
    )
    if (!survey) return NextResponse.json({ error: '問卷不存在' }, { status: 404 })

    const isExternal = body.isExternal === true && !!body.targetUserId
    const targetId = isExternal ? body.targetUserId! : (userId ?? body.responseId)

    // 存入對應表
    for (const [traitKey, score] of Object.entries(body.answers)) {
      if (typeof score !== 'number') continue
      const clampedScore = Math.max(0, Math.min(100, score))

      if (isExternal) {
        await execute(
          `INSERT INTO external_trait_answers (target_user_id, from_user_id, response_id, survey_id, trait_key, score)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [body.targetUserId, userId, body.responseId, survey.id, traitKey, clampedScore]
        )
      } else {
        await execute(
          `INSERT INTO self_trait_answers (user_id, response_id, survey_id, trait_key, score)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, survey_id, trait_key) DO UPDATE SET score = $5`,
          [targetId, body.responseId, survey.id, traitKey, clampedScore]
        )
      }
    }

    // 重算快照（只有自評後才算，他評後由後台批次算）
    let snapshots = null
    if (!isExternal) {
      snapshots = await generateGapSnapshot(targetId, survey.id)
    }

    return NextResponse.json({ ok: true, snapshots })
  } catch (error) {
    console.error('[cognitive-gap/calculate] Failed:', error)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}

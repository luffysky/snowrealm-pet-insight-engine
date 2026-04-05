import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** POST /api/yukiboard/survey/trigger — 情境問卷觸發 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { emotion, app_package } = body

    if (!emotion) {
      return NextResponse.json({ error: 'missing emotion' }, { status: 400 })
    }

    // 查詢符合情緒的啟用中問卷
    const survey = await queryOne<{
      id: string
      question: string
      options: string[]
      reward_zcoin: number
    }>(
      `SELECT id, question, options, reward_zcoin
       FROM yukiboard_surveys
       WHERE is_active = true
         AND trigger_emotions @> ARRAY[$1]::text[]
       ORDER BY created_at DESC
       LIMIT 1`,
      [emotion.toUpperCase()],
    )

    if (!survey) {
      return new Response(null, { status: 204 })
    }

    return NextResponse.json({
      survey_id: survey.id,
      question: survey.question,
      options: survey.options,
      reward_zcoin: survey.reward_zcoin,
    })
  } catch (error) {
    console.error('[Survey Trigger]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

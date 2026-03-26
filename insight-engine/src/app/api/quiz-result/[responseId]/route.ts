import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ResponseRow extends Record<string, unknown> {
  id: string
  survey_id: string
  survey_title: string
  survey_slug: string
  personality_result: Record<string, unknown> | null
}

interface AnswerRow extends Record<string, unknown> {
  question_key: string
  value: string
}

interface SurveyRow extends Record<string, unknown> {
  quiz_config: Record<string, unknown> | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
): Promise<NextResponse> {
  const { responseId } = await params
  if (!responseId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const response = await queryOne<ResponseRow>(
      `SELECT r.id, r.survey_id, s.title AS survey_title, s.slug AS survey_slug,
              r.personality_result
       FROM responses r JOIN surveys s ON s.id = r.survey_id
       WHERE r.id = $1 AND r.status = 'completed'`,
      [responseId]
    )
    if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const shareUrl = `${baseUrl}/result/${responseId}`

    // 如果有快取的 personality_result，直接回傳
    if (response.personality_result) {
      return NextResponse.json({
        ...response.personality_result,
        surveyTitle: response.survey_title,
        shareUrl,
      })
    }

    // 否則嘗試從 answers 重新計算（需要 quiz_config）
    const survey = await queryOne<SurveyRow>(
      `SELECT quiz_config FROM surveys WHERE id = $1`,
      [response.survey_id]
    )

    const answers = await query<AnswerRow>(
      `SELECT question_key, value FROM answers WHERE response_id = $1`,
      [responseId]
    )

    if (!survey?.quiz_config) {
      // 沒有 quiz_config，回傳通用結果
      return NextResponse.json({
        resultKey: '',
        resultType: null,
        surveyTitle: response.survey_title,
        shareUrl,
      })
    }

    // quiz_config 存在但尚未實作完整計算；回傳基本結構
    return NextResponse.json({
      resultKey: '',
      resultType: null,
      surveyTitle: response.survey_title,
      shareUrl,
      answers: answers.slice(0, 5),
    })
  } catch (error) {
    console.error('[quiz-result] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

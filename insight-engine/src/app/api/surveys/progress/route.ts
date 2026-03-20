import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '@/lib/db'

/**
 * POST /api/surveys/progress
 * 追蹤問卷填答進度（漏斗分析用）
 *
 * body: { surveySlug, fingerprint, step, action: 'start' | 'step' }
 * - start: 建立 in_progress response
 * - step:  更新 last_step
 *
 * 回傳 { responseId } 給前端暫存
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    surveySlug?: string
    fingerprint?: string
    step?: number
    action?: string
    responseId?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效格式' }, { status: 400 })
  }

  const { surveySlug, fingerprint, step, action, responseId } = body

  if (!action) {
    return NextResponse.json({ error: '參數不完整' }, { status: 400 })
  }

  try {
    if (action === 'start') {
      if (!surveySlug || !fingerprint) {
        return NextResponse.json({ error: '參數不完整' }, { status: 400 })
      }
      // 檢查是否已提交過（soft block）
      const existing = await queryOne<{ id: string; status: string }>(
        `SELECT id, status FROM responses WHERE fingerprint = $1 AND status = 'completed' LIMIT 1`,
        [fingerprint]
      )

      if (existing) {
        return NextResponse.json({
          alreadySubmitted: true,
          responseId: existing.id,
          message: '你似乎已經填過這份問卷了',
        })
      }

      // 查詢 survey_id
      const survey = await queryOne<{ id: string }>(
        `SELECT id FROM surveys WHERE slug = $1`, [surveySlug]
      )

      // 建立 in_progress response
      const newId = uuidv4()
      await query(
        `INSERT INTO responses (id, session_id, survey_id, status, fingerprint, last_step, started_at)
         VALUES ($1, $2, $3, 'in_progress', $4, 0, NOW())`,
        [newId, uuidv4(), survey?.id ?? null, fingerprint]
      )

      return NextResponse.json({ responseId: newId, alreadySubmitted: false })
    }

    if (action === 'step' && responseId && typeof step === 'number') {
      await query(
        `UPDATE responses SET last_step = GREATEST(last_step, $1)
         WHERE id = $2 AND status = 'in_progress'`,
        [step, responseId]
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: '無效的 action' }, { status: 400 })
  } catch (error) {
    console.error('[progress] Error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

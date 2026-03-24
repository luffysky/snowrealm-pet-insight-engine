import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { generateStoryInsight } from '@/lib/storyEngine'
import { queryOne } from '@/lib/db'

interface StoryRequest {
  surveyId: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as StoryRequest
  const { surveyId } = body

  if (!surveyId) {
    return NextResponse.json({ error: 'surveyId required' }, { status: 400 })
  }

  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  let aiKey = await getActiveAiKey(tenantId)
  let isFree = false

  if (!aiKey) {
    aiKey = getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: '請先在「AI 設定」中新增 API Key 才能產生故事報告' },
        { status: 402 }
      )
    }
    isFree = true
  }

  try {
    const { report, promptTokens, completionTokens } = await generateStoryInsight(
      surveyId,
      tenantId,
      aiKey
    )

    await logAiUsage({
      tenantId,
      action: 'story',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      surveyId,
      promptTokens,
      completionTokens,
      isFree,
    })

    const reportMeta = {
      provider: aiKey.provider,
      model: aiKey.model,
      keySource: aiKey.keySource,
      generatedAt: new Date().toISOString(),
    }

    const saved = await queryOne<{ id: string }>(
      `INSERT INTO ai_insight_reports (tenant_id, survey_id, report, meta, generated_by, report_type)
       VALUES ($1, $2, $3, $4, $5, 'story') RETURNING id`,
      [tenantId, surveyId, JSON.stringify(report), JSON.stringify(reportMeta), roleCheck.userId]
    )

    return NextResponse.json({
      report,
      reportId: saved?.id,
      meta: reportMeta,
      tokenUsage: { prompt: promptTokens, completion: completionTokens },
    })
  } catch (error) {
    console.error('[ai-story] Failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '產生故事報告失敗' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { getTenantContext } from '@/lib/tenant'
import { buildInsightSummary, generateInsightReport } from '@/lib/insightEngine'

interface InsightRequest {
  surveyId: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as InsightRequest
  const { surveyId } = body

  if (!surveyId) {
    return NextResponse.json({ error: '缺少 surveyId' }, { status: 400 })
  }

  const { tenantId } = await getTenantContext()

  let aiKey = await getActiveAiKey(tenantId)
  let isFree = false

  if (!aiKey) {
    aiKey = getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: '請先在「AI 設定」中新增 API Key 才能產生洞察報告' },
        { status: 402 }
      )
    }
    isFree = true
  }

  try {
    const summary = await buildInsightSummary(surveyId, tenantId)
    const { report, promptTokens, completionTokens } = await generateInsightReport(summary, aiKey)

    await logAiUsage({
      tenantId,
      action: 'generate',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      surveyId,
      promptTokens,
      completionTokens,
      isFree,
    })

    return NextResponse.json({
      report,
      meta: {
        provider: aiKey.provider,
        model: aiKey.model,
        keySource: aiKey.keySource,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[ai-insight] Failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '產生洞察報告失敗' },
      { status: 500 }
    )
  }
}

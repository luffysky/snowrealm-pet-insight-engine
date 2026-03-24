import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { getOpenTextResponses, analyzeOpenTextSentiment } from '@/lib/sentimentAnalysis'

const MIN_RESPONSE_COUNT = 3

interface SentimentRequest {
  surveyId: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await getTenantContext()
  const { tenantId } = ctx

  let body: SentimentRequest
  try {
    body = (await request.json()) as SentimentRequest
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const { surveyId } = body
  if (!surveyId?.trim()) {
    return NextResponse.json({ error: '請提供問卷 ID' }, { status: 400 })
  }

  try {
    const texts = await getOpenTextResponses(surveyId, tenantId)

    if (texts.length < MIN_RESPONSE_COUNT) {
      return NextResponse.json(
        { error: `開放題回覆數量不足（至少需要 ${MIN_RESPONSE_COUNT} 筆，目前 ${texts.length} 筆）` },
        { status: 400 }
      )
    }

    const aiKey = (await getActiveAiKey(tenantId)) ?? getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: 'AI Key 未設定，請在 AI 設定中新增 API Key 或聯繫管理員' },
        { status: 500 }
      )
    }

    const result = await analyzeOpenTextSentiment(texts, aiKey)

    await logAiUsage({
      tenantId,
      action: 'generate',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      surveyId,
      promptTokens: 0,
      completionTokens: 0,
      isFree: false,
    })

    return NextResponse.json({
      ...result,
      meta: {
        analyzedCount: texts.length,
        provider: aiKey.provider,
        model: aiKey.model,
        keySource: aiKey.keySource,
      },
    })
  } catch (error) {
    console.error('[ai-sentiment] 情感分析失敗:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '情感分析失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

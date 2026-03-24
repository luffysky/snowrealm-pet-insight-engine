import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { generateStoryInsight } from '@/lib/storyEngine'

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

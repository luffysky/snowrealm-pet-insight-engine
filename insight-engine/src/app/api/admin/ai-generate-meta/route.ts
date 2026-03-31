import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, checkFreeQuota, logAiUsage, AiAction } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { callAiProvider } from '@/lib/aiCall'

interface GenerateMetaRequest {
  topic: string
  description?: string
  targetAudience?: string
  language?: string
  action?: AiAction
}

const SYSTEM_PROMPT = `你是專業的問卷文案企劃。根據使用者提供的主題和描述，生成吸引人的問卷基本設定文案。

規則：
1. 確保文案專業且符合目標受眾語氣
2. coverTitle 是問卷首頁大標題，吸引人點擊
3. coverSubtitle 是問卷首頁副標題，簡單說明目的和所需時間（例如約 3 分鐘）
4. doneTitle 是完成後的感謝大標，要有溫度
5. doneSubtitle 是完成後的後續說明
6. startButtonText 是開始填寫的按鈕文字，需有行動呼籲感
7. ogTitle 和 ogDescription 是給社群分享（LINE、FB）用的精簡標題與摘要

回傳格式為純 JSON 物件，不要加 markdown code block：
{
  "title": "後台管理的問卷名稱（簡潔）",
  "subtitle": "後台管理的問卷副標（可選）",
  "coverTitle": "首頁封面大標題",
  "coverSubtitle": "首頁封面副標題描述",
  "startButtonText": "開始填寫",
  "doneTitle": "感謝您的填寫！",
  "doneSubtitle": "您的寶貴意見將幫助我們提供更好的服務。",
  "ogTitle": "分享標題",
  "ogDescription": "分享描述文字"
}`


function parseGeneratedMeta(raw: string) {
  let jsonStr = raw.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()
  const arrayMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (arrayMatch) jsonStr = arrayMatch[0]

  return JSON.parse(jsonStr)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as GenerateMetaRequest

  const { topic, description, targetAudience, language, action } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: '請輸入問卷主題' }, { status: 400 })
  }

  const effectiveAction = action ?? 'generate_meta'

  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId, userId } = roleCheck

  let aiKey = await getActiveAiKey(tenantId)
  let isFree = false

  if (!aiKey) {
    const hasFree = await checkFreeQuota(tenantId, effectiveAction, userId)
    if (!hasFree) {
      return NextResponse.json(
        { error: '免費額度已用完，請在 AI 設定中新增自己的 API Key' },
        { status: 402 }
      )
    }
    aiKey = getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: '平台 AI Key 未設定，請聯繫管理員' },
        { status: 500 }
      )
    }
    isFree = true
  }

  const lang = language ?? '繁體中文'
  let userPrompt = `主題：${topic}\n語言：${lang}`
  if (description) userPrompt += `\n說明：${description}`
  if (targetAudience) userPrompt += `\n目標受眾：${targetAudience}`

  try {
    let result: { content: string; promptTokens: number; completionTokens: number }

    result = await callAiProvider(aiKey, SYSTEM_PROMPT, userPrompt, { maxTokens: 1500 })

    const metaSettings = parseGeneratedMeta(result.content)

    await logAiUsage({
      tenantId,
      action: effectiveAction,
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      isFree,
    })

    return NextResponse.json({
      metaSettings,
      meta: {
        provider: aiKey.provider,
        model: aiKey.model,
        keySource: aiKey.keySource,
        isFree,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 生成失敗' },
      { status: 500 }
    )
  }
}

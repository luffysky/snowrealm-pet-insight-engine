import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, checkFreeQuota, logAiUsage, AiAction } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'

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

async function callOpenAI(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `OpenAI API 回傳 ${res.status}`)
  }

  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Anthropic API 回傳 ${res.status}`)
  }

  const data = await res.json()
  return {
    content: data.content?.[0]?.text ?? '',
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  }
}

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

    if (aiKey.provider === 'anthropic') {
      result = await callAnthropic(aiKey.apiKey, aiKey.model, userPrompt)
    } else {
      result = await callOpenAI(aiKey.apiKey, aiKey.model, userPrompt)
    }

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

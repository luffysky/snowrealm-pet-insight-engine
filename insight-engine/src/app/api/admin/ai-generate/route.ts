import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, checkFreeQuota, logAiUsage } from '@/lib/aiService'
import { getTenantContext } from '@/lib/tenant'

const MAX_QUESTIONS = 15

interface GenerateRequest {
  topic: string
  description?: string
  targetAudience?: string
  questionCount?: number
  language?: string
  action?: 'generate' | 'regenerate'
}

interface GeneratedQuestion {
  key: string
  type: 'single' | 'multiple' | 'text'
  content: string
  options: { label: string; value: string }[]
  isRequired: boolean
  route: string
}

const SYSTEM_PROMPT = `你是專業的問卷設計師。根據使用者提供的主題和描述，生成高品質的問卷題目。

規則：
1. 題目不超過 ${MAX_QUESTIONS} 題
2. 題目類型可以是：single（單選）、multiple（多選）、text（文字輸入）
3. 單選和多選題必須有 2~7 個選項
4. 每個選項的 label 和 value 必須一致
5. 至少有 1 題是 text 類型（開放式問題）
6. route 預設為 'all'
7. key 格式為 q1, q2, q3...
8. isRequired 預設為 true，text 題可設為 false
9. 題目要有邏輯順序：先簡單→再深入→最後開放

回傳格式為純 JSON 陣列，不要加 markdown code block：
[
  {
    "key": "q1",
    "type": "single",
    "content": "題目文字",
    "options": [{"label": "選項A", "value": "選項A"}],
    "isRequired": true,
    "route": "all"
  }
]`

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
      max_tokens: 3000,
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
      max_tokens: 3000,
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

function parseGeneratedQuestions(raw: string): GeneratedQuestion[] {
  // 嘗試從回傳文字中提取 JSON
  let jsonStr = raw.trim()

  // 移除可能的 markdown code block
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()

  // 嘗試找 JSON array
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
  if (arrayMatch) jsonStr = arrayMatch[0]

  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) throw new Error('AI 回傳格式不正確')

  // 驗證並標準化
  return parsed.slice(0, MAX_QUESTIONS).map((q: Record<string, unknown>, i: number) => ({
    key: typeof q.key === 'string' ? q.key : `q${i + 1}`,
    type: (['single', 'multiple', 'text'] as const).find((t) => t === q.type) ?? 'single',
    content: typeof q.content === 'string' ? q.content : '',
    options: Array.isArray(q.options)
      ? (q.options as { label: string; value: string }[]).map((o) => ({
          label: String(o.label ?? o.value ?? ''),
          value: String(o.value ?? o.label ?? ''),
        }))
      : [],
    isRequired: q.isRequired !== false,
    route: typeof q.route === 'string' ? q.route : 'all',
  }))
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as GenerateRequest

  const { topic, description, targetAudience, questionCount, language, action } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: '請輸入問卷主題' }, { status: 400 })
  }

  const effectiveAction = action ?? 'generate'

  const { tenantId } = await getTenantContext()

  // 決定使用哪個 key
  let aiKey = await getActiveAiKey(tenantId)
  let isFree = false

  if (!aiKey) {
    // 沒有自己的 key，嘗試用免費額度
    const hasFree = await checkFreeQuota(tenantId, effectiveAction)
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

  // 組裝 prompt
  const count = Math.min(questionCount ?? 10, MAX_QUESTIONS)
  const lang = language ?? '繁體中文'
  let userPrompt = `主題：${topic}\n題數：${count} 題\n語言：${lang}`
  if (description) userPrompt += `\n說明：${description}`
  if (targetAudience) userPrompt += `\n目標受眾：${targetAudience}`

  try {
    let result: { content: string; promptTokens: number; completionTokens: number }

    if (aiKey.provider === 'anthropic') {
      result = await callAnthropic(aiKey.apiKey, aiKey.model, userPrompt)
    } else {
      // openai, google(兼容), custom 都走 OpenAI-compatible
      result = await callOpenAI(aiKey.apiKey, aiKey.model, userPrompt)
    }

    const questions = parseGeneratedQuestions(result.content)

    // 記錄使用紀錄
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
      questions,
      meta: {
        provider: aiKey.provider,
        model: aiKey.model,
        keySource: aiKey.keySource,
        isFree,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 生成失敗' },
      { status: 500 }
    )
  }
}

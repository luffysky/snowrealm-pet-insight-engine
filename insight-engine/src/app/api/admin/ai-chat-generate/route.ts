import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { SURVEY_CHAT_SYSTEM_PROMPT } from '@/lib/aiSurveyPrompt'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
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
        { role: 'system', content: SURVEY_CHAT_SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenAI API 回傳 ${res.status}`)
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
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
      system: SURVEY_CHAT_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Anthropic API 回傳 ${res.status}`)
  }

  const data = await res.json() as {
    content?: { text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  return {
    content: data.content?.[0]?.text ?? '',
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as ChatRequest
  const { messages } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: '訊息不能為空' }, { status: 400 })
  }

  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  let aiKey = await getActiveAiKey(tenantId)
  const isUsingPlatformKey = !aiKey

  if (!aiKey) {
    aiKey = getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: '請先在「AI 設定」中新增 API Key 才能使用 AI 對話建立功能' },
        { status: 402 }
      )
    }
  }

  try {
    let result: { content: string; promptTokens: number; completionTokens: number }

    if (aiKey.provider === 'anthropic') {
      result = await callAnthropic(aiKey.apiKey, aiKey.model, messages)
    } else {
      // openai, google(兼容), custom 都走 OpenAI-compatible
      result = await callOpenAI(aiKey.apiKey, aiKey.model, messages)
    }

    await logAiUsage({
      tenantId,
      action: 'chat',
      keySource: isUsingPlatformKey ? 'platform_key' : aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      isFree: false,
    })

    return NextResponse.json({
      reply: result.content,
      meta: {
        provider: aiKey.provider,
        model: aiKey.model,
        keySource: aiKey.keySource,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 對話失敗' },
      { status: 500 }
    )
  }
}

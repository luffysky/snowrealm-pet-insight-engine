import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { SURVEY_CHAT_SYSTEM_PROMPT } from '@/lib/aiSurveyPrompt'
import { callAnthropicApi } from '@/lib/aiCall'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

async function callOpenAiChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  baseUrl?: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const base = (baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SURVEY_CHAT_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `AI API 回傳 ${res.status}`)
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
      // Anthropic 多輪：把 messages 的最後一條 user 訊息作為 userContent，其餘作為上下文附加
      const userContent = messages.map(m => `${m.role === 'user' ? '用戶' : '助手'}: ${m.content}`).join('\n\n')
      result = await callAnthropicApi(aiKey.apiKey, aiKey.model, SURVEY_CHAT_SYSTEM_PROMPT, userContent, { maxTokens: 4000 })
    } else {
      result = await callOpenAiChat(aiKey.apiKey, aiKey.model, messages, aiKey.baseUrl)
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

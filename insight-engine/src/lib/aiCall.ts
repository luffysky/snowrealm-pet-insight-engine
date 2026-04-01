/**
 * 統一 AI 呼叫工具
 * 支援 OpenAI / Ollama / Qwen / 任何 OpenAI-compatible endpoint，以及 Anthropic
 */

export interface AiCallResult {
  content: string
  promptTokens: number
  completionTokens: number
}

/**
 * OpenAI-compatible API 呼叫
 * baseUrl 預設為 https://api.openai.com/v1
 * Ollama: http://localhost:11434/v1
 * Qwen:   https://dashscope.aliyuncs.com/compatible-mode/v1
 */
export async function callOpenAiCompatible(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  options?: { baseUrl?: string; temperature?: number; maxTokens?: number }
): Promise<AiCallResult> {
  const base = (options?.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 3000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `AI API 回傳 ${res.status}`)
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

/** Anthropic API 呼叫 */
export async function callAnthropicApi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string,
  options?: { maxTokens?: number; baseUrl?: string }
): Promise<AiCallResult> {
  const base = (options?.baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '')
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options?.maxTokens ?? 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Anthropic API 回傳 ${res.status}`)
  }

  const data = await res.json() as {
    content?: { type: string; text: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  return {
    content: data.content?.[0]?.text ?? '',
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  }
}

/**
 * 使用前驗證 API Key 是否有效（輕量 ping，幾乎不消耗 tokens）
 * OpenAI-compatible: GET /v1/models（零 tokens）
 * Anthropic: POST /v1/messages max_tokens=1（≈ $0）
 */
export async function validateAiKey(
  key: { provider: string; apiKey: string; model: string; baseUrl?: string }
): Promise<void> {
  const timeout = AbortSignal.timeout(5000)

  if (key.provider === 'anthropic') {
    const base = (key.baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '')
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': key.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: key.model, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      signal: timeout,
    })
    if (res.status === 401) throw new Error('API Key 無效或已過期，請到 AI 設定頁面重新設定')
    if (res.status === 403) throw new Error('API Key 權限不足，請確認帳號狀態')
  } else {
    const base = (key.baseUrl ?? 'https://api.openai.com').replace(/\/$/, '')
    const res = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
      signal: timeout,
    })
    if (res.status === 401) throw new Error('API Key 無效或已過期，請到 AI 設定頁面重新設定')
    if (res.status === 403) throw new Error('API Key 權限不足，請確認帳號狀態')
  }
}

/**
 * 統一分流：根據 provider 自動選擇 OpenAI-compatible 或 Anthropic
 * 這是最常用的函式，所有 AI 功能都應該透過這個呼叫
 */
export async function callAiProvider(
  aiKey: { provider: string; apiKey: string; model: string; baseUrl?: string },
  systemPrompt: string,
  userContent: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<AiCallResult> {
  if (aiKey.provider === 'anthropic') {
    return callAnthropicApi(aiKey.apiKey, aiKey.model, systemPrompt, userContent, { ...options, baseUrl: aiKey.baseUrl })
  }
  return callOpenAiCompatible(
    aiKey.apiKey,
    aiKey.model,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { baseUrl: aiKey.baseUrl, ...options }
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'

type AiTextAction = 'rewrite' | 'shorten' | 'expand' | 'fix' | 'translate'

const ACTION_PROMPTS: Record<AiTextAction, string> = {
  rewrite:
    '改寫以下文字，保持原意但用不同的表達方式，讓語句更流暢自然。直接回傳改寫後的文字，不要加任何前綴說明：',
  shorten:
    '精簡以下文字，保持原意但更簡潔有力，去除冗餘。直接回傳精簡後的文字，不要加任何前綴說明：',
  expand:
    '展開以下文字，補充更多細節、例子或解釋，讓內容更豐富完整。直接回傳展開後的文字，不要加任何前綴說明：',
  fix:
    '修正以下文字的錯字、文法和標點符號問題，保持原意不變。直接回傳修正後的文字，不要加任何前綴說明：',
  translate:
    '如果以下文字是中文，翻譯成英文；如果是英文或其他語言，翻譯成繁體中文。直接回傳翻譯後的文字，不要加任何前綴說明：',
}

const VALID_ACTIONS = new Set<string>(['rewrite', 'shorten', 'expand', 'fix', 'translate'])

/** POST /api/admin/social/blog/ai-text
 *  對選取的文字執行 AI 操作（改寫、精簡、展開、修正、翻譯）
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const body = await req.json() as {
    text: string
    action: string
    context?: string
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: '請選取文字' }, { status: 400 })
  }

  if (!VALID_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: '無效的操作' }, { status: 400 })
  }

  const action = body.action as AiTextAction

  const aiKey = await getActiveAiKey(ctx.tenantId ?? 'default') ?? getPlatformKey()
  if (!aiKey) {
    return NextResponse.json({ error: '尚未設定 AI Key，請至 AI 設定頁面配置' }, { status: 400 })
  }

  const systemPrompt = '你是一位專業的繁體中文文字編輯助手。只回傳處理後的文字，不要加引號、前綴說明或額外解釋。'
  const contextHint = body.context ? `\n\n（文章上下文：${body.context.slice(0, 300)}）` : ''
  const userPrompt = `${ACTION_PROMPTS[action]}\n\n${body.text}${contextHint}`

  const promptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4)

  try {
    let result = ''

    if (aiKey.provider === 'anthropic') {
      const baseUrl = aiKey.baseUrl || 'https://api.anthropic.com'
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': aiKey.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[] }
      result = data.content?.[0]?.text ?? ''
    } else {
      const baseUrl = aiKey.baseUrl || 'https://api.openai.com'
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiKey.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'gpt-4o-mini',
          max_tokens: 2048,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })
      const data = await res.json() as { choices?: { message: { content: string } }[] }
      result = data.choices?.[0]?.message?.content ?? ''
    }

    if (!result.trim()) {
      return NextResponse.json({ error: 'AI 回應為空，請再試一次' }, { status: 500 })
    }

    const completionTokens = Math.ceil(result.length / 4)
    await logAiUsage({
      tenantId: ctx.tenantId ?? 'default',
      action: 'generate',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model ?? '',
      promptTokens,
      completionTokens,
      isFree: aiKey.keySource === 'platform_key',
    })

    return NextResponse.json({ result: result.trim() })
  } catch (err) {
    console.error('[blog/ai-text]', err)
    return NextResponse.json({ error: 'AI 處理失敗，請稍後再試' }, { status: 500 })
  }
}

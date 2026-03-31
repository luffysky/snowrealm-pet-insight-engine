import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { spendZcoin, getBalance } from '@/lib/zcoinEngine'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'

export const runtime = 'nodejs'

const ZCOIN_COST = 200

interface AiWriteResult {
  title: string
  content: string
  summary: string
  tags: string[]
  seoTitle: string
  seoDesc: string
  suggestedSlug: string
}

/**
 * POST /api/blogs/ai-write
 * 公開（需登入）端點，雪凜 AI 寫作流程用
 * 消耗 200 Z幣（平台特權免費）
 */
export async function POST(req: NextRequest) {
  // 直接從 cookie 驗 JWT（不走 middleware headers）
  const token = req.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.sub ?? null

  if (!userId) {
    return NextResponse.json({ error: '請先登入才能使用 AI 寫作功能' }, { status: 401 })
  }

  const isUnlimited = await isUserPlatformUnlimited(userId)

  // 非特權用戶檢查 Z幣
  if (!isUnlimited) {
    const balance = await getBalance({ userId })
    if (balance < ZCOIN_COST) {
      return NextResponse.json({
        error: `Z幣不足（需要 ${ZCOIN_COST} Z幣，你有 ${balance} Z幣）`,
        balance,
        cost: ZCOIN_COST,
      }, { status: 402 })
    }
  }

  const body = await req.json() as {
    prompt: string
    existingTitle?: string
    existingContent?: string
    mode?: 'full' | 'outline' | 'refine'
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: '請描述你想寫的文章' }, { status: 400 })
  }

  // 取得 AI Key（優先用戶自己設定的，fallback 到平台 key）
  const tenantId = payload?.tenants?.[0]?.tid ?? 'default'
  const aiKey = await getActiveAiKey(tenantId) ?? getPlatformKey()
  if (!aiKey) {
    return NextResponse.json({ error: '尚未設定 AI Key，請至 AI 設定頁面配置' }, { status: 400 })
  }

  const mode = body.mode ?? 'full'

  const systemPrompt = `你是一位有個性的繁體中文部落格作者。你的文章讀起來像真人在說話，不像 AI 寫的。

核心原則：
- 用第一人稱「我」，帶入個人感受和真實情緒
- 不用「首先、其次、再者、最後」這種公式化結構
- 不用「深度剖析」「全面了解」「值得關注」這類 AI 慣用語
- 句子有長有短，節奏自然，偶爾用口語（但不失水準）
- 舉的例子要具體、有畫面感，不要抽象空泛
- 觀點鮮明，不怕有立場，不用「可能」「也許」逃避
- 開頭不要講廢話，直接進入有趣的點
- 結尾有點餘味，不用「希望本文對你有幫助」作結`

  let userPrompt = ''

  if (mode === 'refine' && body.existingContent) {
    const plain = body.existingContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    userPrompt = `請根據以下指示改善這篇文章：

指示：${body.prompt}

現有標題：${body.existingTitle ?? '（未定）'}
現有內容摘要：${plain.slice(0, 500)}

請回傳改善後的完整 JSON（不要包裝在 markdown code block 中）：
{
  "title": "（改善後標題）",
  "content": "（改善後 HTML 格式內容，使用 <h2><h3><p><ul><li><strong><em><blockquote> 等標籤）",
  "summary": "（50-100 字摘要）",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "seoTitle": "（SEO 優化標題）",
  "seoDesc": "（50-120 字 SEO 描述）",
  "suggestedSlug": "（英文 slug，小寫加連字號）"
}`
  } else if (mode === 'outline') {
    userPrompt = `請根據以下需求生成文章大綱（使用 HTML 格式，有標題和說明）：

需求：${body.prompt}

請回傳 JSON（不要包裝在 markdown code block 中）：
{
  "title": "（建議標題）",
  "content": "（文章大綱，HTML 格式，每個章節用 <h2> 和 <p> 說明要點）",
  "summary": "（預計文章的摘要方向）",
  "tags": ["建議標籤1", "建議標籤2"],
  "seoTitle": "（SEO 標題建議）",
  "seoDesc": "（SEO 描述建議）",
  "suggestedSlug": "（英文 slug）"
}`
  } else {
    userPrompt = `請根據以下需求，撰寫一篇完整的繁體中文部落格文章：

需求：${body.prompt}

要求：
- 文章長度：600-1500 字
- 內容格式：使用 HTML 標籤（<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>）
- 結構：有引言、主體（2-4個章節）、結語
- 風格：真實、有個性、讀起來像人在說話，不要有 AI 腔
- 禁止用語：深度解析、全面了解、不容忽視、值得關注、希望本文對你有幫助
- 開頭要吸引人，不要用「在這個時代...」「隨著...的發展...」這種老套

請回傳以下 JSON（不要包裝在 markdown code block 中）：
{
  "title": "（文章標題，20字以內）",
  "content": "（完整 HTML 格式文章內容）",
  "summary": "（50-100 字摘要，讓讀者想點進來看）",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "seoTitle": "（SEO 優化標題，包含核心關鍵字）",
  "seoDesc": "（50-120 字 SEO 描述）",
  "suggestedSlug": "（英文 slug，小寫加連字號，最長 60 字元）"
}`
  }

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
  const promptTokens = Math.ceil(fullPrompt.length / 4)

  try {
    let raw = ''

    if (aiKey.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': aiKey.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[]; error?: { message: string } }
      if (!res.ok) throw new Error(data.error?.message ?? 'Anthropic API error')
      raw = data.content?.[0]?.text ?? ''
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiKey.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'gpt-4o-mini',
          max_tokens: 4096,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      })
      const data = await res.json() as { choices?: { message: { content: string } }[]; error?: { message: string } }
      if (!res.ok) throw new Error(data.error?.message ?? 'OpenAI API error')
      raw = data.choices?.[0]?.message?.content ?? ''
    }

    const completionTokens = Math.ceil(raw.length / 4)
    await logAiUsage({
      tenantId,
      action: 'generate',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model ?? '',
      promptTokens,
      completionTokens,
      isFree: aiKey.keySource === 'platform_key' || isUnlimited,
    })

    // 提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI 回應格式錯誤，請再試一次' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0]) as Partial<AiWriteResult>

    const slug = (result.suggestedSlug ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)

    // 成功後扣 Z幣
    let newBalance: number | null = null
    if (!isUnlimited) {
      const result2 = await spendZcoin({ userId, amount: ZCOIN_COST, reason: 'ai_usage' })
      newBalance = result2.newBalance ?? null
    }

    return NextResponse.json({
      title: result.title ?? '',
      content: result.content ?? '',
      summary: result.summary ?? '',
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 8) : [],
      seoTitle: result.seoTitle ?? '',
      seoDesc: result.seoDesc ?? '',
      suggestedSlug: slug,
      newBalance,
      model: aiKey.model ?? (aiKey.provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o-mini'),
    } satisfies AiWriteResult & { newBalance: number | null; model: string })
  } catch (err) {
    console.error('[blogs/ai-write]', err)
    return NextResponse.json({ error: `AI 生成失敗：${(err as Error).message ?? '請稍後再試'}` }, { status: 500 })
  }
}

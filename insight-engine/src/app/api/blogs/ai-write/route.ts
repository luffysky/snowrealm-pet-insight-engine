import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { spendZcoin, getBalance } from '@/lib/zcoinEngine'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { validateAiKey } from '@/lib/aiCall'
import { queryOne } from '@/lib/db'

export const runtime = 'nodejs'

// Z幣成本：tier × mode
const ZCOIN_COSTS = {
  sonnet: { full: 200, outline: 50, refine: 100, research: 30 },
  haiku:  { full: 80,  outline: 20, refine: 40,  research: 15 },
} as const

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_MODEL = 'claude-sonnet-4-6'
const OPENAI_HAIKU_MODEL = 'gpt-4o-mini'   // OpenAI 沒有 haiku，haiku 降到 mini
const OPENAI_SONNET_MODEL = 'gpt-4o'

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
 * GET /api/blogs/ai-write — 偵測用戶是否有正在使用中的 AI Key
 * 必須同時滿足：is_active = true AND is_primary = true（代表用戶有在用這把 key）
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.sub ?? null
  if (!userId) return NextResponse.json({ hasOwnKey: false, isUnlimited: false })

  const tenantId = payload?.tenants?.[0]?.tid ?? 'default'
  const [primaryRow, isUnlimited] = await Promise.all([
    queryOne<{ provider: string; default_model: string | null }>(
      `SELECT provider, default_model
       FROM ai_provider_configs
       WHERE tenant_id = $1 AND is_active = true AND is_primary = true
       LIMIT 1`,
      [tenantId]
    ),
    isUserPlatformUnlimited(userId),
  ])

  return NextResponse.json({
    hasOwnKey: !!primaryRow,
    ownKeyProvider: primaryRow?.provider ?? null,
    ownKeyModel: primaryRow?.default_model ?? null,
    isUnlimited,
  })
}

/**
 * POST /api/blogs/ai-write
 * 公開（需登入）端點，雪凜 AI 寫作流程用
 * keyPreference='own'  → 使用用戶自己的 key，免費
 * keyPreference='platform' → 使用平台 key，扣 Z幣
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

  const body = await req.json() as {
    prompt: string
    existingTitle?: string
    existingContent?: string
    mode?: 'full' | 'outline' | 'refine' | 'research'
    tier?: 'sonnet' | 'haiku'
    keyPreference?: 'own' | 'platform'
    /** 研究成果，用於 full 模式中提升文章品質 */
    researchContext?: string
  }

  const mode = body.mode ?? 'full'
  const tier = body.tier ?? 'sonnet'
  const tenantId = payload?.tenants?.[0]?.tid ?? 'default'

  // 決定使用哪個 key
  const ownKey = await getActiveAiKey(tenantId)
  const platformKey = getPlatformKey()
  const keyPreference = body.keyPreference ?? (ownKey ? 'own' : 'platform')

  let aiKey: ReturnType<typeof getPlatformKey>
  let usingOwnKey: boolean

  if (keyPreference === 'own') {
    if (!ownKey) return NextResponse.json({ error: '您尚未設定自己的 AI Key，請至 AI 設定頁面配置' }, { status: 400 })
    aiKey = ownKey
    usingOwnKey = true
  } else {
    if (!platformKey) return NextResponse.json({ error: '尚未設定 AI Key，請至 AI 設定頁面配置' }, { status: 400 })
    aiKey = platformKey
    usingOwnKey = false
  }

  // 使用平台 key 才需要 Z幣（自己的 key 免費；平台禮遇也免費）
  const zcoinCost = usingOwnKey ? 0 : ZCOIN_COSTS[tier][mode]

  if (!usingOwnKey && !isUnlimited) {
    const balance = await getBalance({ userId })
    if (balance < zcoinCost) {
      return NextResponse.json({
        error: `Z幣不足（需要 ${zcoinCost} Z幣，你有 ${balance} Z幣）`,
        balance,
        cost: zcoinCost,
        hasOwnKey: !!ownKey,
      }, { status: 402 })
    }
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: '請描述你想寫的文章' }, { status: 400 })
  }

  // tier 決定平台 key 的模型；自訂 key 使用用戶設定的模型
  const resolvedModel = usingOwnKey
    ? (aiKey!.model ?? (aiKey!.provider === 'anthropic' ? SONNET_MODEL : OPENAI_SONNET_MODEL))
    : (aiKey!.provider === 'anthropic'
        ? (tier === 'haiku' ? HAIKU_MODEL : SONNET_MODEL)
        : (tier === 'haiku' ? OPENAI_HAIKU_MODEL : OPENAI_SONNET_MODEL))

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
  } else if (mode === 'research') {
    userPrompt = `針對以下主題進行深度研究分析，為部落格寫作提供素材：

主題：${body.prompt}

請整理出以下內容並回傳 JSON（不要包裝在 markdown code block 中）：
{
  "title": "（適合寫成文章的標題建議）",
  "content": "（研究摘要，HTML 格式，包含：<h2>核心觀點</h2>、<h2>重要數據或事實</h2>、<h2>不同角度與觀點</h2>、<h2>可延伸討論的方向</h2>，每個章節用 <p> 說明重點）",
  "summary": "（50-100 字，這個主題最值得寫的切入點）",
  "tags": ["相關標籤1", "相關標籤2", "相關標籤3"],
  "seoTitle": "（SEO 標題建議）",
  "seoDesc": "（SEO 描述建議）",
  "suggestedSlug": "（英文 slug）"
}

注意：這是研究素材，不是正式文章。請提供具體事實、數據（如有）、多元觀點，讓作者有豐富素材可以發揮。`
  } else {
    const cleanResearch = (body.researchContext ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, 2000)
    const researchSection = cleanResearch
      ? `\n\n以下是關於此主題的研究素材，請善用這些資料讓文章更有深度：\n${cleanResearch}`
      : ''

    userPrompt = `請根據以下需求，撰寫一篇完整的繁體中文部落格文章：

需求：${body.prompt}${researchSection}

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

  // 清理 prompt 中可能導致 JSON.stringify 失敗的字元
  const sanitize = (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  const fullPrompt = sanitize(`${systemPrompt}\n\n${userPrompt}`)
  const promptTokens = Math.ceil(fullPrompt.length / 4)

  try {
    // 使用前先驗證 API Key 是否有效
    await validateAiKey(aiKey!)

    let raw = ''

    if (aiKey!.provider === 'anthropic') {
      const baseUrl = aiKey!.baseUrl ?? 'https://api.anthropic.com'
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': aiKey!.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[]; error?: { message: string } }
      if (!res.ok) throw new Error(data.error?.message ?? 'Anthropic API error')
      raw = data.content?.[0]?.text ?? ''
    } else {
      const baseUrl = aiKey!.baseUrl ?? 'https://api.openai.com'
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiKey!.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: resolvedModel,
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
      keySource: aiKey!.keySource,
      provider: aiKey!.provider,
      model: resolvedModel,
      promptTokens,
      completionTokens,
      isFree: usingOwnKey || isUnlimited,
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

    // 成功後扣 Z幣（只有使用平台 key 且非特權用戶才扣）
    let newBalance: number | null = null
    if (!usingOwnKey && !isUnlimited && zcoinCost > 0) {
      const result2 = await spendZcoin({ userId, amount: zcoinCost, reason: 'ai_usage' })
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
      model: resolvedModel,
      cost: zcoinCost,
    } satisfies AiWriteResult & { newBalance: number | null; model: string; cost: number })
  } catch (err) {
    console.error('[blogs/ai-write]', err)
    return NextResponse.json({ error: `AI 生成失敗：${(err as Error).message ?? '請稍後再試'}` }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'

/** POST /api/admin/social/blog/ai-meta
 *  使用 AI 生成部落格文章的摘要、SEO 標題、SEO 描述，以及將中文標題翻成英文 slug
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    title: string
    content?: string
    mode: 'summary' | 'slug'
  }

  if (!body.title?.trim()) return NextResponse.json({ error: '缺少標題' }, { status: 400 })

  const aiKey = await getActiveAiKey(ctx.tenantId ?? 'default') ?? getPlatformKey()
  if (!aiKey) return NextResponse.json({ error: '尚未設定 AI Key，請至 AI 設定頁面配置' }, { status: 400 })

  const plainContent = (body.content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500)

  let prompt = ''
  if (body.mode === 'slug') {
    prompt = `請將以下中文標題翻譯成適合作為 URL slug 的英文（全小寫、以連字號分隔單字、無特殊符號、最長 60 字元）。
只回傳 slug 本身，不要加任何說明或標點。

標題：${body.title}`
  } else {
    prompt = `你是一位擅長內容摘要的編輯。根據以下文章標題和內文，生成：
1. 摘要（summary）：50-100 字，適合顯示在文章列表頁，吸引讀者點擊
2. SEO 標題（seoTitle）：20-40 字，優化搜尋引擎，包含關鍵字
3. SEO 描述（seoDesc）：50-120 字，讓搜尋結果更吸引人

請以下面的 JSON 格式回傳（不要包裝在 markdown code block 中）：
{"summary":"...","seoTitle":"...","seoDesc":"..."}

文章標題：${body.title}
${plainContent ? `\n文章內容：${plainContent}` : ''}`
  }

  try {
    let raw = ''
    const promptTokens = Math.ceil(prompt.length / 4)

    if (aiKey.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': aiKey.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[] }
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
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as { choices?: { message: { content: string } }[] }
      raw = data.choices?.[0]?.message?.content ?? ''
    }

    await logAiUsage({
      tenantId: ctx.tenantId ?? 'default',
      action: 'generate_meta',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model ?? '',
      promptTokens,
      completionTokens: Math.ceil(raw.length / 4),
      isFree: aiKey.keySource === 'platform_key',
    })

    if (body.mode === 'slug') {
      const slug = raw.trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)
      return NextResponse.json({ slug })
    }

    // Parse JSON for summary mode
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI 回應格式錯誤，請再試一次' }, { status: 500 })
    const result = JSON.parse(jsonMatch[0]) as { summary?: string; seoTitle?: string; seoDesc?: string }

    return NextResponse.json({
      summary: result.summary ?? '',
      seoTitle: result.seoTitle ?? '',
      seoDesc: result.seoDesc ?? '',
    })
  } catch (err) {
    console.error('[blog/ai-meta]', err)
    return NextResponse.json({ error: 'AI 生成失敗，請稍後再試' }, { status: 500 })
  }
}

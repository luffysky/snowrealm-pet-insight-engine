import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { uploadToR2 } from '@/lib/r2'

type CoverStyle = 'realistic' | 'illustration' | 'abstract' | 'minimal'

const STYLE_DESCRIPTORS: Record<CoverStyle, string> = {
  realistic: 'photorealistic, high quality photograph, natural lighting',
  illustration: 'digital illustration, clean vector art style, modern and colorful',
  abstract: 'abstract art, geometric shapes, gradient colors, artistic composition',
  minimal: 'minimalist design, simple shapes, clean white space, subtle colors',
}

function buildCoverPrompt(title: string, summary: string, tags: string[], style: CoverStyle): string {
  const styleDesc = STYLE_DESCRIPTORS[style]
  const tagHint = tags.length > 0 ? `Related themes: ${tags.slice(0, 5).join(', ')}.` : ''

  return `Create a blog cover image. ${styleDesc}.
The image should visually represent the following article topic without any text or letters:
Title: "${title}"
${summary ? `Summary: "${summary.slice(0, 200)}"` : ''}
${tagHint}
Professional, clean composition suitable for a blog header. No text, no watermarks, no logos.`
}

/** POST /api/admin/social/blog/ai-cover — AI 生成部落格封面圖片 */
export async function POST(req: NextRequest) {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as {
    title?: string
    summary?: string
    tags?: string[]
    style?: CoverStyle
  }

  const title = body.title?.trim()
  if (!title) {
    return NextResponse.json({ error: '請先填寫文章標題' }, { status: 400 })
  }

  const summary = body.summary?.trim() ?? ''
  const tags = body.tags ?? []
  const style: CoverStyle = body.style && STYLE_DESCRIPTORS[body.style] ? body.style : 'illustration'

  // DALL-E 3 only works with OpenAI keys
  const ownKey = await getActiveAiKey(roleCheck.tenantId)
  const platformKey = getPlatformKey()

  // Prefer own key if it's OpenAI; otherwise fall back to platform key
  const aiKey = (ownKey?.provider === 'openai' ? ownKey : null) ?? platformKey
  if (!aiKey) {
    return NextResponse.json(
      { error: '需要 OpenAI API Key 才能生成封面圖片。請至 AI 設定頁面配置。' },
      { status: 400 },
    )
  }

  const coverPrompt = buildCoverPrompt(title, summary, tags, style)

  try {
    const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiKey.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: coverPrompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      }),
    })

    if (!dalleRes.ok) {
      const errData = await dalleRes.json().catch(() => ({})) as { error?: { message?: string } }
      const msg = errData.error?.message ?? `DALL-E API 回傳 ${dalleRes.status}`
      console.error('[ai-cover] DALL-E error:', msg)
      return NextResponse.json({ error: `圖片生成失敗：${msg}` }, { status: 502 })
    }

    const dalleData = await dalleRes.json() as {
      data?: { url?: string; revised_prompt?: string }[]
    }
    const imageUrl = dalleData.data?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'DALL-E 未回傳圖片' }, { status: 502 })
    }

    // Download the image
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: '下載生成的圖片失敗' }, { status: 502 })
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Upload to R2
    const r2Url = await uploadToR2(imgBuffer, 'ai-cover.png', 'image/png', 'blog-covers')

    // Log AI usage
    await logAiUsage({
      tenantId: roleCheck.tenantId,
      action: 'generate_meta',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: 'dall-e-3',
      promptTokens: Math.ceil(coverPrompt.length / 4),
      completionTokens: 0,
      isFree: aiKey.keySource === 'platform_key',
    })

    return NextResponse.json({ imageUrl: r2Url })
  } catch (err) {
    console.error('[ai-cover] Failed:', err)
    return NextResponse.json({ error: 'AI 封面生成失敗，請稍後再試' }, { status: 500 })
  }
}

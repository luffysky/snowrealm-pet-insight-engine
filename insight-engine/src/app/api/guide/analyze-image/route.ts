import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { spendZcoin, getBalance } from '@/lib/zcoinEngine'
import { getActiveAiKey, getPlatformKey } from '@/lib/aiService'
import { getTenantContext } from '@/lib/tenant'

export const runtime = 'nodejs'

const IMAGE_ZCOIN_COST = 20  // 每張圖片分析 20 Z幣

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  const userId = payload?.sub ?? null

  if (!userId) {
    return NextResponse.json({ error: '請先登入才能使用圖片分析功能' }, { status: 401 })
  }

  // 檢查平台特權
  const isUnlimited = await isUserPlatformUnlimited(userId)

  // 非特權用戶需要 Z幣
  if (!isUnlimited) {
    const balance = await getBalance({ userId })
    if (balance < IMAGE_ZCOIN_COST) {
      return NextResponse.json({
        error: `Z幣不足（需要 ${IMAGE_ZCOIN_COST} Z幣，你有 ${balance} Z幣）`,
        balance,
        cost: IMAGE_ZCOIN_COST,
      }, { status: 402 })
    }
  }

  // 解析 FormData
  const form = await req.formData()
  const file = form.get('image') as File | null
  const character = (form.get('character') as string) ?? 'yukirin'
  const userQuestion = (form.get('question') as string) ?? ''

  if (!file) {
    return NextResponse.json({ error: '請選擇圖片' }, { status: 400 })
  }

  // 限制檔案大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '圖片太大，請選擇 5MB 以內的圖片' }, { status: 400 })
  }

  // 轉成 base64
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  // 取得 AI Key
  const ctx = await getTenantContext()
  const aiKey = await getActiveAiKey(ctx.tenantId ?? 'default') ?? getPlatformKey()
  if (!aiKey) {
    return NextResponse.json({ error: '尚未設定 AI Key' }, { status: 400 })
  }

  // 角色人設 prompt
  const characterPrompt = character === 'riku'
    ? `你是凜空，冷靜、話少但內心細膩的男生。說話簡短有力，不廢話，但看到有趣的東西會有反應。用繁體中文回答，最多 100 字。`
    : `你是雪凜，活潑可愛、反應誇張的女生，但說話有深度不幼稚。用繁體中文回答，帶點情緒，最多 120 字。`

  const userPrompt = userQuestion
    ? `${characterPrompt}\n\n用戶傳來這張圖片，並問：「${userQuestion}」\n請回應圖片內容並回答問題。`
    : `${characterPrompt}\n\n用戶傳來這張圖片，請你看圖自然地回應，說說你看到什麼、有什麼感覺或想法。`

  try {
    let responseText = ''

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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64 },
              },
              { type: 'text', text: userPrompt },
            ],
          }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[] }
      responseText = data.content?.[0]?.text ?? ''
    } else {
      // OpenAI vision
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiKey.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model ?? 'gpt-4o-mini',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          }],
        }),
      })
      const data = await res.json() as { choices?: { message: { content: string } }[] }
      responseText = data.choices?.[0]?.message?.content ?? ''
    }

    if (!responseText) {
      return NextResponse.json({ error: 'AI 沒有回應，請再試一次' }, { status: 500 })
    }

    // 扣 Z幣（非特權用戶）
    let newBalance: number | null = null
    if (!isUnlimited) {
      const result = await spendZcoin({ userId, amount: IMAGE_ZCOIN_COST, reason: 'ai_usage' })
      newBalance = result.newBalance ?? null
    }

    return NextResponse.json({
      text: responseText,
      newBalance,
      cost: isUnlimited ? 0 : IMAGE_ZCOIN_COST,
    })
  } catch (err) {
    console.error('[analyze-image]', err)
    return NextResponse.json({ error: 'AI 分析失敗，請稍後再試' }, { status: 500 })
  }
}

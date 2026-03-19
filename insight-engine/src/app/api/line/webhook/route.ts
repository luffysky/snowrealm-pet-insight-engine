import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''

// 問卷連結（部署後改為正式 domain）
const SURVEY_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/survey`
  : 'https://localhost:3000/survey'

/**
 * LINE Messaging API Webhook
 * 接收使用者訊息，自動回覆問卷連結 / 關鍵字回應
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!CHANNEL_SECRET) {
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-line-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  // 驗證簽章
  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64')

  if (hash !== signature) {
    console.warn('[LINE Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    // 只處理使用者傳來的文字訊息
    if (event.type === 'message' && event.message?.type === 'text') {
      const text = (event.message.text as string).trim()
      const replyToken = event.replyToken as string
      const reply = getAutoReply(text)
      await replyMessage(replyToken, reply)
    }

    // 使用者加入好友（follow）
    if (event.type === 'follow') {
      const replyToken = event.replyToken as string
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: '🐾 歡迎來到毛行天下！\n\n我們正在打造一個留下寵物足跡的平台。\n\n輸入「問卷」即可填寫，幫我們更了解你的需求 💛',
        },
      ])
    }
  }

  return NextResponse.json({ ok: true })
}

// ----- 關鍵字自動回覆邏輯 -----

interface LineTextMessage {
  type: 'text'
  text: string
}

function getAutoReply(text: string): LineTextMessage[] {
  // 問卷相關
  if (/問卷|填問卷|survey/i.test(text)) {
    return [
      {
        type: 'text',
        text: `📋 毛行天下 MVP 問卷\n\n花 2 分鐘填寫，幫助我們打造更好的寵物紀錄平台！\n\n👉 ${SURVEY_URL}`,
      },
    ]
  }

  // 封測 / 名單
  if (/封測|內測|名單|waitlist/i.test(text)) {
    return [
      {
        type: 'text',
        text: `🎉 想加入封測？\n\n填完問卷後即可留下 email 加入封測名單，上線第一時間通知你！\n\n👉 ${SURVEY_URL}`,
      },
    ]
  }

  // 關於毛行天下
  if (/毛行天下|你是誰|什麼|介紹/i.test(text)) {
    return [
      {
        type: 'text',
        text: '🐾 毛行天下 SnowRealm\n\n我們想做的，不只是紀錄，而是讓那些重要的存在，不那麼容易被時間沖淡。\n\n一個真正能留下寵物足跡的地方。',
      },
    ]
  }

  // 預設回覆
  return [
    {
      type: 'text',
      text: '嗨～我是毛行天下小助手 🐾\n\n你可以輸入：\n📋「問卷」— 填寫問卷\n🎉「封測」— 加入封測名單\n🐾「毛行天下」— 了解我們',
    },
  ]
}

// ----- Reply API -----

async function replyMessage(
  replyToken: string,
  messages: LineTextMessage[]
): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN) return

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ replyToken, messages }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[LINE Reply] Failed (${res.status}):`, body)
    }
  } catch (err) {
    console.error('[LINE Reply] Error:', err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * SnowRealm Insight Engine 系統專用 LINE Webhook
 * Webhook URL: https://insight.snowrealm.pet/api/line/webhook/insight-engine
 *
 * 環境變數：
 * - LINE_INSIGHT_CHANNEL_SECRET（驗簽用）
 * - LINE_INSIGHT_CHANNEL_ACCESS_TOKEN（回覆用）
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = process.env.LINE_INSIGHT_CHANNEL_SECRET ?? ''
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN ?? ''

  if (!CHANNEL_SECRET) {
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  // 驗證簽名
  const signature = request.headers.get('x-line-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()
  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64')

  if (hash !== signature) {
    console.warn('[LINE Insight Engine Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 加好友 → 歡迎訊息
    if (event.type === 'follow' && event.replyToken) {
      await replyMessage(
        event.replyToken,
        '👋 歡迎使用 SnowRealm Insight Engine！\n\n📊 您的問卷系統管理通知帳號已連結。\n\n有人註冊或登入平台時，系統會自動發送通知給您。',
        CHANNEL_ACCESS_TOKEN,
      )
    }

    // 文字訊息 → 提示
    if (event.type === 'message' && event.message?.type === 'text' && event.replyToken) {
      await replyMessage(
        event.replyToken,
        '📊 SnowRealm Insight Engine 通知帳號\n\n此帳號用於接收系統通知（註冊、登入等）。\n\n🌐 管理後台：https://insight.snowrealm.pet',
        CHANNEL_ACCESS_TOKEN,
      )
    }

    // 取消追蹤 → log
    if (event.type === 'unfollow' && userId) {
      console.log(`[LINE Insight Engine] User unfollowed: ${userId}`)
    }
  }

  return NextResponse.json({ ok: true })
}

/** 回覆訊息 */
async function replyMessage(replyToken: string, text: string, accessToken: string): Promise<void> {
  if (!accessToken) return
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  }).catch(() => {})
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getLineConfig } from '@/lib/lineConfig'

/**
 * SnowRealm Insight Engine 系統專用 LINE Webhook
 * Webhook URL: https://insight.snowrealm.pet/api/line/webhook/insight-engine
 *
 * 使用 getLineConfig 從 DB / ENV 讀取（跟 official 一致）：
 * - INSIGHT_CHANNEL_SECRET（驗簽用）
 * - INSIGHT_CHANNEL_ACCESS_TOKEN（回覆用）
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = await getLineConfig('INSIGHT_CHANNEL_SECRET') ?? ''
  const CHANNEL_ACCESS_TOKEN = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN') ?? ''

  if (!CHANNEL_SECRET) {
    console.error('[LINE Insight Engine Webhook] LINE_INSIGHT_CHANNEL_SECRET 未設定')
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  // 驗證簽名
  const signature = request.headers.get('x-line-signature')
  if (!signature) {
    console.warn('[LINE Insight Engine Webhook] Missing x-line-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  // Debug log（上線穩定後可移除）
  console.log('[LINE Insight Engine Webhook] Received request, body length:', rawBody.length)

  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64')

  if (hash !== signature) {
    console.warn('[LINE Insight Engine Webhook] Signature mismatch')
    console.warn('[LINE Insight Engine Webhook] Expected:', hash.slice(0, 10) + '...')
    console.warn('[LINE Insight Engine Webhook] Got:', signature.slice(0, 10) + '...')
    console.warn('[LINE Insight Engine Webhook] Secret starts with:', CHANNEL_SECRET.slice(0, 4) + '...')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // LINE Verify 會發空 events 陣列，直接回 200
  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  if (events.length === 0) {
    console.log('[LINE Insight Engine Webhook] Verify request - OK')
    return NextResponse.json({ ok: true })
  }

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
        `📊 SnowRealm Insight Engine 通知帳號\n\n此帳號用於接收系統通知（註冊、登入等）。\n\n🌐 管理後台：${process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'}`,
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

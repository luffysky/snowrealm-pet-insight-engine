import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CHANNEL_SECRET = process.env.LINE_INSIGHT_CHANNEL_SECRET ?? ''

/**
 * LINE Insight (問卷帳號) Webhook
 * 僅用於接收驗證 — 使用者互動已移至 /api/line/webhook/official
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!CHANNEL_SECRET) {
    return NextResponse.json({ error: 'LINE Insight not configured' }, { status: 500 })
  }

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
    console.warn('[LINE Insight Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // 問卷帳號不需要回覆使用者，僅驗證通過即可
  return NextResponse.json({ ok: true })
}



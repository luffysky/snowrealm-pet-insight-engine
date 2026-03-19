import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '@/lib/db'

const CHANNEL_SECRET = process.env.LINE_INSIGHT_CHANNEL_SECRET ?? ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN ?? ''

/**
 * LINE Insight (問卷帳號) Webhook
 * @762wxvfb — 加好友自動註冊為管理員，取消追蹤則停用
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

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 加好友 → 自動註冊管理員
    if (event.type === 'follow' && userId) {
      const displayName = await getLineDisplayName(userId)
      await query(
        `INSERT INTO line_admins (line_user_id, display_name, active)
         VALUES ($1, $2, true)
         ON CONFLICT (line_user_id) DO UPDATE SET active = true, display_name = COALESCE($2, line_admins.display_name)`,
        [userId, displayName]
      )
      console.log(`[LINE Insight] Admin registered: ${userId} (${displayName})`)

      // 歡迎訊息
      if (CHANNEL_ACCESS_TOKEN && event.replyToken) {
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: '✅ 你已成為問卷系統管理員！\n\n之後每次有人填寫問卷，你都會收到通知 📋\n\n點選下方選單可直接查看後台數據 📊',
              },
            ],
          }),
        }).catch(() => {})
      }
    }

    // 取消追蹤 → 停用管理員
    if (event.type === 'unfollow' && userId) {
      await query(
        `UPDATE line_admins SET active = false WHERE line_user_id = $1`,
        [userId]
      )
      console.log(`[LINE Insight] Admin deactivated: ${userId}`)
    }
  }

  return NextResponse.json({ ok: true })
}

/** 取得 LINE 使用者名稱 */
async function getLineDisplayName(userId: string): Promise<string | null> {
  if (!CHANNEL_ACCESS_TOKEN) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const profile = await res.json() as { displayName?: string }
    return profile.displayName ?? null
  } catch {
    return null
  }
}



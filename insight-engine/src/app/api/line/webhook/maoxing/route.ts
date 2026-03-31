import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getLineConfig } from '@/lib/lineConfig'
import { query } from '@/lib/db'

/**
 * 毛行天下-足跡站 Webhook
 * 私人帳號，只接受管理員 LINE User ID 的訊息
 * 用途：問卷新回覆通知、數據回報推送
 *
 * LINE Developers Console Webhook URL:
 *   https://insight.snowrealm.pet/api/line/webhook/maoxing
 * Token: LINE_MAOXING_CHANNEL_ACCESS_TOKEN / LINE_MAOXING_CHANNEL_SECRET
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = process.env.LINE_MAOXING_CHANNEL_SECRET ?? ''
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_MAOXING_CHANNEL_ACCESS_TOKEN ?? ''

  if (!CHANNEL_SECRET) {
    console.error('[Maoxing Webhook] LINE_MAOXING_CHANNEL_SECRET 未設定')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-line-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const rawBody = await request.text()
  const hash = crypto.createHmac('SHA256', CHANNEL_SECRET).update(rawBody).digest('base64')
  if (hash !== signature) return NextResponse.json({ error: 'invalid signature' }, { status: 403 })

  const body = JSON.parse(rawBody)
  const events = body.events ?? []
  if (events.length === 0) return NextResponse.json({ ok: true })

  const ADMIN_USER_ID = await getLineConfig('ADMIN_USER_ID') ?? ''

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 加好友
    if (event.type === 'follow' && event.replyToken) {
      await reply(event.replyToken, '🐾 毛行天下足跡站已連線\n\n問卷有新回覆時會自動通知你。', CHANNEL_ACCESS_TOKEN)
    }

    // 只回應管理員
    if (event.type === 'message' && event.message?.type === 'text') {
      if (ADMIN_USER_ID && userId !== ADMIN_USER_ID) continue

      const text = event.message.text as string

      if (/今日|今天|報告/.test(text)) {
        const stats = await getTodayStats()
        await reply(event.replyToken, stats, CHANNEL_ACCESS_TOKEN)
      } else if (event.replyToken) {
        await reply(event.replyToken, '📊 毛行天下足跡站\n\n傳「今日報告」查看今日數據', CHANNEL_ACCESS_TOKEN)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

async function getTodayStats(): Promise<string> {
  try {
    const rows = await query<{ today: string; total: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE submitted_at >= CURRENT_DATE) AS today,
        COUNT(*) AS total
       FROM responses
       WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'maoxingtianxia' LIMIT 1)
         AND status = 'completed'`,
      []
    )
    const { today, total } = rows[0] ?? { today: '0', total: '0' }
    return `📊 毛行天下今日數據\n\n今日填答：${today} 筆\n累計填答：${total} 筆`
  } catch {
    return '📊 查詢失敗，請稍後再試'
  }
}

async function reply(replyToken: string, text: string, accessToken: string): Promise<void> {
  if (!accessToken || !replyToken) return
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  }).catch(() => {})
}

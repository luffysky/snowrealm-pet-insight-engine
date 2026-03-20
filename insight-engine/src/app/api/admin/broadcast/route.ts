import { NextRequest, NextResponse } from 'next/server'
import { broadcastMessage } from '@/lib/line'
import { query, execute } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'

/** GET /api/admin/broadcast?logs=1 — 推播紀錄 */
export async function GET(): Promise<NextResponse> {
  const rows = await query<{
    id: string; message: string; tag_filter: unknown; sent_count: number; created_at: string
  }>('SELECT * FROM broadcast_logs ORDER BY created_at DESC LIMIT 50')
  return NextResponse.json(rows)
}

/**
 * POST /api/admin/broadcast
 * 群發訊息 / 分眾推播
 * body: { text, tagFilter?: { key, value } }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    text?: string
    tagFilter?: { key: string; value: string }
    scheduledAt?: string
  }

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: '訊息不可為空' }, { status: 400 })
  }

  // 排程推播：寫入 broadcast_logs 等待 cron 執行
  if (body.scheduledAt) {
    const scheduledAt = new Date(body.scheduledAt)
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return NextResponse.json({ error: '排程時間必須是未來時間' }, { status: 400 })
    }
    await execute(
      'INSERT INTO broadcast_logs (message, tag_filter, sent_count, scheduled_at) VALUES ($1, $2, 0, $3)',
      [text, body.tagFilter ? JSON.stringify(body.tagFilter) : null, scheduledAt.toISOString()]
    )
    return NextResponse.json({ ok: true, scheduled: true, scheduledAt: scheduledAt.toISOString() })
  }

  const messages = [{ type: 'text' as const, text }]

  // 如果有 tagFilter，走分眾推播
  if (body.tagFilter) {
    const { key, value } = body.tagFilter
    const rows = await query<{ line_user_id: string }>(
      `SELECT DISTINCT l.line_user_id
       FROM line_users l
       JOIN user_tags t ON t.response_id = l.response_id
       WHERE t.tag_key = $1 AND t.tag_value = $2`,
      [key, value]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: '找不到符合條件的使用者（需先透過 LIFF 綁定）', sent: 0 }, { status: 404 })
    }

    const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
    const userIds = rows.map((r) => r.line_user_id)

    for (let i = 0; i < userIds.length; i += 500) {
      const batch = userIds.slice(i, i + 500)
      await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: batch, messages }),
      })
    }

    await execute(
      'INSERT INTO broadcast_logs (message, tag_filter, sent_count) VALUES ($1, $2, $3)',
      [text, JSON.stringify({ key, value }), userIds.length]
    )

    return NextResponse.json({ ok: true, sent: userIds.length })
  }

  // 無 tagFilter → 群發給所有好友
  const result = await broadcastMessage(messages)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  await execute(
    'INSERT INTO broadcast_logs (message, sent_count) VALUES ($1, 0)',
    [text]
  )

  return NextResponse.json({ ok: true, broadcast: true })
}

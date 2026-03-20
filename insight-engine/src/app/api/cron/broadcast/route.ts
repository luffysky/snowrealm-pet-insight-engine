import { NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { broadcastMessage } from '@/lib/line'
import { getStyle, buildFlexBubble } from '@/lib/lineStyles'

/**
 * GET /api/cron/broadcast
 * 執行已到期的排程推播
 * 可由 Zeabur Cron 或外部排程每分鐘呼叫
 */
export async function GET(): Promise<NextResponse> {
  const rows = await query<{ id: string; message: string; tag_filter: unknown }>(
    `SELECT id, message, tag_filter
     FROM broadcast_logs
     WHERE scheduled_at IS NOT NULL
       AND scheduled_at <= NOW()
       AND sent_count = 0
     ORDER BY scheduled_at ASC
     LIMIT 10`
  )

  if (rows.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  const style = await getStyle('broadcast')

  for (const row of rows) {
    let messages: { type: string; [key: string]: unknown }[]
    if (style) {
      const msg = buildFlexBubble({
        style,
        bodyRows: [{ label: '訊息', value: row.message }],
        altText: `${style.header_emoji} ${style.header_text}`,
      })
      messages = [msg]
    } else {
      messages = [{ type: 'text' as const, text: row.message }]
    }

    if (row.tag_filter) {
      const filter = row.tag_filter as { key: string; value: string }
      const users = await query<{ line_user_id: string }>(
        `SELECT DISTINCT l.line_user_id
         FROM line_users l
         JOIN user_tags t ON t.response_id = l.response_id
         WHERE t.tag_key = $1 AND t.tag_value = $2`,
        [filter.key, filter.value]
      )

      if (users.length > 0) {
        const token = process.env.LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN ?? ''
        const userIds = users.map((u) => u.line_user_id)
        for (let i = 0; i < userIds.length; i += 500) {
          await fetch('https://api.line.me/v2/bot/message/multicast', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ to: userIds.slice(i, i + 500), messages }),
          })
        }
        await execute(
          'UPDATE broadcast_logs SET sent_count = $1 WHERE id = $2',
          [userIds.length, row.id]
        )
      } else {
        // Mark as processed even if no users
        await execute('UPDATE broadcast_logs SET sent_count = -1 WHERE id = $1', [row.id])
      }
    } else {
      const result = await broadcastMessage(messages)
      await execute(
        'UPDATE broadcast_logs SET sent_count = $1 WHERE id = $2',
        [result.ok ? 1 : -1, row.id]
      )
    }

    processed++
  }

  return NextResponse.json({ processed })
}

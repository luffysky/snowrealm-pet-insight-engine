import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushToUser } from '@/lib/line'
import { getStyle, buildFlexBubble } from '@/lib/lineStyles'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

/**
 * GET /api/cron/remind
 * 對未完成問卷的使用者推送提醒
 * 條件：responses 狀態為 started，且超過 1 天未更新，且已綁定 LINE userId
 * 可由 Zeabur Cron 或外部排程呼叫
 */
export async function GET(): Promise<NextResponse> {
  const rows = await query<{ line_user_id: string; display_name: string | null; survey_slug: string }>(
    `SELECT l.line_user_id, l.display_name, s.slug AS survey_slug
     FROM responses r
     JOIN line_users l ON l.response_id = r.id
     JOIN surveys s ON s.id = r.survey_id
     WHERE r.status = 'in_progress'
       AND r.updated_at < NOW() - INTERVAL '1 day'
     LIMIT 100`
  )

  if (rows.length === 0) {
    return NextResponse.json({ reminded: 0 })
  }

  let sent = 0
  const style = await getStyle('remind')

  for (const row of rows) {
    const name = row.display_name ?? '你'
    let messages: { type: string; [key: string]: unknown }[]

    if (style) {
      const msg = buildFlexBubble({
        style,
        bodyRows: [
          { label: '對象', value: name },
          { label: '狀態', value: '問卷還差一點點就完成了，快回來繼續吧！' },
        ],
        altText: `${style.header_emoji} ${style.header_text}`,
      })
      messages = [msg]
    } else {
      messages = [
        {
          type: 'flex',
          altText: '🐾 問卷還沒填完喔！',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              contents: [
                { type: 'text', text: '🐾 問卷還沒填完喔！', weight: 'bold', size: 'lg', color: '#333333' },
                { type: 'text', text: `${name}，你的問卷還差一點點就完成了，快回來繼續吧！`, size: 'sm', color: '#666666', wrap: true },
              ],
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: { type: 'uri', label: '繼續填寫', uri: `${BASE_URL}/survey` },
                  style: 'primary',
                  color: '#0e7990',
                },
              ],
            },
          },
        },
      ]
    }

    const result = await pushToUser(row.line_user_id, messages)
    if (result.ok) sent++
  }

  return NextResponse.json({ reminded: sent, total: rows.length })
}

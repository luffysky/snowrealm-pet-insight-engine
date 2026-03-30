import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sendProactivePush } from '@/lib/proactive/pushEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/daily-greeting
 * 每天 09:00：早安問候給開啟通知的使用者
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 取得社群今日統計
    let storyCount = 0
    try {
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM responses
         WHERE created_at >= CURRENT_DATE AND status = 'completed'`
      )
      storyCount = parseInt(rows[0]?.count ?? '0', 10)
    } catch {
      // non-fatal
    }

    const message = storyCount > 0
      ? `早安～ 今天已經有 ${storyCount} 個人在 Insight 上分享了故事喔，去看看大家都說什麼？`
      : '早安～ 今天的 Insight 等著你來探索！新的一天，新的問卷等你填 ✦'

    // 取得有開啟早安問候的使用者
    const users = await getUsersWithGreeting()

    let sent = 0
    for (const user of users) {
      await sendProactivePush({
        userId: user.id,
        channel: 'line',
        message,
        mood: 'happy',
        action: { type: 'navigate', target: '/' },
        priority: 'low',
        triggerType: 'daily_greeting',
      })
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[daily-greeting] Error:', err)
    return NextResponse.json({ error: '早安問候失敗' }, { status: 500 })
  }
}

async function getUsersWithGreeting(): Promise<Array<{ id: string }>> {
  try {
    return query<{ id: string }>(
      `SELECT unp.user_id AS id
       FROM user_notification_prefs unp
       WHERE unp.morning_greeting = true AND unp.proactive_enabled = true
       LIMIT 100`
    )
  } catch {
    return []
  }
}

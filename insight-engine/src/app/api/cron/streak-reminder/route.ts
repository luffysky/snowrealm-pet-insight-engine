import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { sendProactivePush } from '@/lib/proactive/pushEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/streak-reminder
 * 每天 20:00：連續登入提醒（給今天還沒登入的連續登入使用者）
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 找出：有連續登入紀錄 但今天還沒登入的使用者
    const users = await getUsersNotLoggedInToday()
    let sent = 0

    for (const user of users) {
      const streak = await getUserLoginStreak(user.id)
      if (streak < 2) continue  // 不足 2 天連續不提醒

      await sendProactivePush({
        userId: user.id,
        channel: 'line',
        message: `欸你今天還沒來欸！已經連續 ${streak} 天了，別讓紀錄斷掉啊～`,
        mood: 'sad',
        action: { type: 'navigate', target: '/' },
        priority: 'normal',
        triggerType: 'streak_reminder',
      })
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[streak-reminder] Error:', err)
    return NextResponse.json({ error: '連續登入提醒失敗' }, { status: 500 })
  }
}

async function getUsersNotLoggedInToday(): Promise<Array<{ id: string }>> {
  try {
    return query<{ id: string }>(
      `SELECT DISTINCT au.id
       FROM admin_users au
       JOIN user_notification_prefs unp ON unp.user_id = au.id
       WHERE unp.streak_reminder = true
         AND unp.proactive_enabled = true
         AND au.id NOT IN (
           SELECT DISTINCT user_id FROM activity_log
           WHERE action = 'auth.login'
             AND created_at >= CURRENT_DATE
             AND user_id IS NOT NULL
         )
         AND EXISTS (
           SELECT 1 FROM activity_log
           WHERE user_id = au.id
             AND action = 'auth.login'
             AND created_at >= NOW() - INTERVAL '7 days'
         )
       LIMIT 50`
    )
  } catch {
    return []
  }
}

async function getUserLoginStreak(userId: string): Promise<number> {
  try {
    const rows = await query<{ login_date: string }>(
      `SELECT DISTINCT DATE(created_at) AS login_date
       FROM activity_log
       WHERE user_id = $1 AND action = 'auth.login'
       ORDER BY login_date DESC
       LIMIT 30`,
      [userId]
    )
    if (rows.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < rows.length; i++) {
      const date = new Date(rows[i].login_date)
      const expected = new Date(today)
      expected.setDate(today.getDate() - (i + 1))  // 昨天、前天...
      if (date.toDateString() !== expected.toDateString()) break
      streak++
    }

    return streak
  } catch {
    return 0
  }
}

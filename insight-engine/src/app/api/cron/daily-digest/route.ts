import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { executeSkill } from '@/lib/skills/skillEngine'
import { pushLineMessage } from '@/lib/line'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/daily-digest
 * 每天 23:00：生成今日社群摘要並推送給管理員
 */
export async function GET(): Promise<NextResponse> {
  try {
    const result = await executeSkill('social_digest', {
      userId: 'system',
      trigger: 'scheduled',
    })

    if (!result.executed || !result.message) {
      return NextResponse.json({ ok: true, sent: false, reason: 'no_data' })
    }

    // 取得今日統計
    let stats = { responses: 0, newUsers: 0 }
    try {
      const rows = await query<{ responses: string; new_users: string }>(
        `SELECT
           (SELECT COUNT(*)::text FROM responses WHERE created_at >= CURRENT_DATE) AS responses,
           (SELECT COUNT(*)::text FROM admin_users WHERE created_at >= CURRENT_DATE) AS new_users`
      )
      if (rows[0]) {
        stats = {
          responses: parseInt(rows[0].responses, 10),
          newUsers: parseInt(rows[0].new_users, 10),
        }
      }
    } catch {
      // non-fatal
    }

    const digestText = `📊 今日社群摘要\n\n${result.message}\n\n今日新增填答：${stats.responses} 份\n新用戶：${stats.newUsers} 人`

    await pushLineMessage([{ type: 'text', text: digestText }])

    return NextResponse.json({ ok: true, sent: true })
  } catch (err) {
    console.error('[daily-digest] Error:', err)
    return NextResponse.json({ error: '社群摘要失敗' }, { status: 500 })
  }
}

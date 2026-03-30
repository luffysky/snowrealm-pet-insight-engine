import { NextResponse } from 'next/server'
import { execute } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/daily-reset
 * 每天 00:00：重置每日額度、清理過期任務
 */
export async function GET(): Promise<NextResponse> {
  try {
    let cleaned = 0

    // 清理 7 天前的已執行/取消/失敗任務
    try {
      await execute(
        `DELETE FROM scheduled_tasks
         WHERE status IN ('executed', 'cancelled', 'failed')
           AND created_at < NOW() - INTERVAL '7 days'`
      )
      cleaned++
    } catch {
      // table might not exist
    }

    // 清理 30 天前的推送記錄
    try {
      await execute(
        `DELETE FROM push_log WHERE created_at < NOW() - INTERVAL '30 days'`
      )
      cleaned++
    } catch {
      // non-fatal
    }

    // 重置 guide_chat_rate（每日免費額度）— 已有自動按日期分隔，只清舊資料
    try {
      await execute(
        `DELETE FROM guide_chat_rate WHERE date < CURRENT_DATE - INTERVAL '7 days'`
      )
      cleaned++
    } catch {
      // non-fatal
    }

    // 清理過期的 LINE survey sessions
    try {
      await execute(
        `UPDATE line_survey_sessions
         SET status = 'abandoned'
         WHERE status = 'in_progress'
           AND updated_at < NOW() - INTERVAL '24 hours'`
      )
      cleaned++
    } catch {
      // non-fatal
    }

    return NextResponse.json({ ok: true, cleaned })
  } catch (err) {
    console.error('[daily-reset] Error:', err)
    return NextResponse.json({ error: '每日重置失敗' }, { status: 500 })
  }
}

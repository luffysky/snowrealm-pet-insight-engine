// Cron: abandon LINE survey sessions that have been inactive for 24+ hours
// Called by Zeabur cron or manually
import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const result = await queryOne<{ count: string }>(
      `WITH abandoned AS (
         UPDATE line_survey_sessions
         SET status = 'abandoned', updated_at = NOW()
         WHERE status = 'in_progress'
           AND updated_at < NOW() - INTERVAL '24 hours'
         RETURNING id
       )
       SELECT COUNT(*)::TEXT AS count FROM abandoned`,
    )
    const count = parseInt(result?.count ?? '0', 10)
    console.log(`[cron/cleanup-sessions] Abandoned ${count} expired sessions`)
    return NextResponse.json({ ok: true, abandoned: count })
  } catch (err) {
    console.error('[cron/cleanup-sessions] Failed:', err)
    return NextResponse.json({ error: 'cleanup failed' }, { status: 500 })
  }
}

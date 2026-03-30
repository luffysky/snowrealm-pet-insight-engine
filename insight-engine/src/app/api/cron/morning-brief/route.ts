import { NextResponse } from 'next/server'
import { executeSkill } from '@/lib/skills/skillEngine'
import { pushLineMessage } from '@/lib/line'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/morning-brief
 * 每天 08:00：雪凜老闆晨報推送給管理員
 */
export async function GET(): Promise<NextResponse> {
  try {
    const result = await executeSkill('admin_morning_brief', {
      userId: 'system',
      trigger: 'scheduled',
    })

    if (result.executed && result.message) {
      await pushLineMessage([{ type: 'text', text: result.message }])
    }

    return NextResponse.json({ ok: true, sent: result.executed })
  } catch (err) {
    console.error('[morning-brief] Error:', err)
    return NextResponse.json({ error: '晨報發送失敗' }, { status: 500 })
  }
}

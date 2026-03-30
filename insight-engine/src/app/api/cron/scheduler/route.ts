import { NextResponse } from 'next/server'
import { getPendingTasks, markTaskExecuted, markTaskFailed, scheduleNextOccurrence } from '@/lib/scheduler/taskScheduler'
import { sendProactivePush, getLineUserIdFromPlatformId, sendLineUserPush, buildYukirinFlexMessage } from '@/lib/proactive/pushEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/scheduler
 * 每分鐘執行：處理所有到期的排程任務
 */
export async function GET(): Promise<NextResponse> {
  try {
    const tasks = await getPendingTasks()
    let executed = 0
    let failed = 0

    for (const task of tasks) {
      try {
        await executeTask(task)
        await markTaskExecuted(task.id)

        if (task.recurring) {
          await scheduleNextOccurrence(task)
        }
        executed++
      } catch (err) {
        console.error(`[scheduler] Task ${task.id} failed:`, err)
        await markTaskFailed(task.id)
        failed++
      }
    }

    return NextResponse.json({ executed, failed, total: tasks.length })
  } catch (err) {
    console.error('[scheduler] Error:', err)
    return NextResponse.json({ error: '排程執行失敗' }, { status: 500 })
  }
}

async function executeTask(task: {
  id: string
  user_id: string
  type: string
  payload: Record<string, unknown>
  channel: string
  yukirin_message: string | null
}): Promise<void> {
  const message = task.yukirin_message

  switch (task.type) {
    case 'reminder':
    case 'streak_reminder':
    case 'comeback':
    case 'achievement_nudge':
    case 'zcoin_alert':
    case 'custom':
    case 'delayed_push': {
      if (!message) return
      await sendProactivePush({
        userId: task.user_id,
        channel: task.channel as 'line' | 'web' | 'both',
        message,
        mood: (task.payload.mood as string) ?? 'happy',
        action: task.payload.action as { type: string; target: string } | undefined,
        priority: 'normal',
        triggerType: task.type,
      })
      break
    }

    case 'survey_followup': {
      const surveyTitle = task.payload.surveyTitle as string ?? '問卷'
      const responseId = task.payload.responseId as string
      const followupMsg = `一週前你填了「${surveyTitle}」還記得嗎？現在回頭看那個結果，你覺得準嗎～`

      await sendProactivePush({
        userId: task.user_id,
        channel: 'line',
        message: followupMsg,
        mood: 'thinking',
        action: responseId ? { type: 'navigate', target: `/done?id=${responseId}` } : undefined,
        priority: 'low',
        triggerType: 'survey_followup',
      })
      break
    }

    case 'weekly_report': {
      // 週報由 weekly-reporter 技能處理，這裡只觸發
      const lineUserId = await getLineUserIdFromPlatformId(task.user_id)
      if (!lineUserId || !message) return
      const flexMsg = buildYukirinFlexMessage(message, 'happy') as Record<string, unknown>
      await sendLineUserPush(lineUserId, [flexMsg])
      break
    }

    default:
      console.warn(`[scheduler] Unknown task type: ${task.type}`)
  }
}

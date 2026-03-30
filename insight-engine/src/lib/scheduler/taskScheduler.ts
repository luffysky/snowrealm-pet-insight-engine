// lib/scheduler/taskScheduler.ts — 雪凜排程任務引擎

import { query, queryOne, execute } from '@/lib/db'

export type ScheduledTaskType =
  | 'reminder'
  | 'weekly_report'
  | 'streak_reminder'
  | 'survey_followup'
  | 'zcoin_alert'
  | 'birthday'
  | 'comeback'
  | 'content_digest'
  | 'achievement_nudge'
  | 'custom'
  | 'delayed_push'

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number   // 0-6
  timeOfDay: string    // "09:00"
}

export interface ScheduledTask {
  id: string
  user_id: string
  type: ScheduledTaskType
  execute_at: string
  recurring: RecurringConfig | null
  payload: Record<string, unknown>
  channel: 'line' | 'web' | 'both'
  status: 'pending' | 'executed' | 'cancelled' | 'failed'
  yukirin_message: string | null
  created_at: string
}

/** 建立排程任務 */
export async function createTask(params: {
  userId: string
  type: ScheduledTaskType
  executeAt: Date
  recurring?: RecurringConfig
  payload?: Record<string, unknown>
  channel?: 'line' | 'web' | 'both'
  yukirinMessage?: string
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO scheduled_tasks (user_id, type, execute_at, recurring, payload, channel, yukirin_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      params.userId,
      params.type,
      params.executeAt.toISOString(),
      params.recurring ? JSON.stringify(params.recurring) : null,
      JSON.stringify(params.payload ?? {}),
      params.channel ?? 'line',
      params.yukirinMessage ?? null,
    ]
  )
  return row?.id ?? ''
}

/** 取得待執行的任務（execute_at <= now） */
export async function getPendingTasks(): Promise<ScheduledTask[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM scheduled_tasks
     WHERE status = 'pending' AND execute_at <= NOW()
     ORDER BY execute_at ASC
     LIMIT 100`
  )
  return rows as unknown as ScheduledTask[]
}

/** 標記任務為已執行 */
export async function markTaskExecuted(taskId: string): Promise<void> {
  await execute(
    `UPDATE scheduled_tasks SET status = 'executed' WHERE id = $1`,
    [taskId]
  )
}

/** 標記任務失敗 */
export async function markTaskFailed(taskId: string): Promise<void> {
  await execute(
    `UPDATE scheduled_tasks SET status = 'failed' WHERE id = $1`,
    [taskId]
  )
}

/** 取消任務 */
export async function cancelTask(taskId: string, userId: string): Promise<void> {
  await execute(
    `UPDATE scheduled_tasks SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
    [taskId, userId]
  )
}

/** 排下一次重複任務 */
export async function scheduleNextOccurrence(task: ScheduledTask): Promise<void> {
  if (!task.recurring) return

  const next = getNextExecuteTime(task.recurring)
  if (!next) return

  await execute(
    `INSERT INTO scheduled_tasks (user_id, type, execute_at, recurring, payload, channel, yukirin_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      task.user_id,
      task.type,
      next.toISOString(),
      JSON.stringify(task.recurring),
      JSON.stringify(task.payload),
      task.channel,
      task.yukirin_message,
    ]
  )
}

function getNextExecuteTime(recurring: RecurringConfig): Date | null {
  const [h, m] = recurring.timeOfDay.split(':').map(Number)
  const next = new Date()
  next.setHours(h, m, 0, 0)

  if (recurring.frequency === 'daily') {
    if (next <= new Date()) next.setDate(next.getDate() + 1)
    return next
  }

  if (recurring.frequency === 'weekly') {
    const targetDay = recurring.dayOfWeek ?? 0
    const daysUntil = (targetDay - next.getDay() + 7) % 7 || 7
    next.setDate(next.getDate() + daysUntil)
    return next
  }

  if (recurring.frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1)
    return next
  }

  return null
}

/** 自然語言解析排程（用於聊天建立排程） */
export function parseScheduleIntent(message: string): boolean {
  const SCHEDULE_PATTERNS = [
    /(?:明天|後天|下週|(\d+)天後).*(?:提醒|通知|叫我)/,
    /每(?:天|週|月).*(?:提醒|通知|叫我)/,
    /(\d+)點.*(?:提醒|通知)/,
    /別讓我忘了/,
    /記得提醒我/,
    /設.{0,3}提醒/,
  ]
  return SCHEDULE_PATTERNS.some(p => p.test(message))
}

/** 列出使用者的排程任務 */
export async function getUserTasks(userId: string): Promise<ScheduledTask[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM scheduled_tasks
     WHERE user_id = $1 AND status = 'pending'
     ORDER BY execute_at ASC
     LIMIT 20`,
    [userId]
  )
  return rows as unknown as ScheduledTask[]
}

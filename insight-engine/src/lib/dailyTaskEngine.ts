/**
 * 每日任務引擎 — 用戶每日可完成的任務，完成後獲得 Z幣
 * 任務每日午夜重置
 *
 * 所需 DB migration:
 * -- CREATE TABLE IF NOT EXISTS daily_task_logs (
 * --   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 * --   user_id UUID NOT NULL,
 * --   task_id TEXT NOT NULL,
 * --   completed_at TIMESTAMPTZ DEFAULT NOW()
 * -- );
 * -- CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_task_logs (user_id, completed_at);
 */
import { query, execute } from './db'
import { getOrCreateWallet } from './zcoinEngine'

// ===== 任務定義 =====

interface TaskConfig {
  id: string
  title: string
  description: string
  emoji: string
  reward: number
  maxCompletions: number
}

const DAILY_TASKS: TaskConfig[] = [
  {
    id: 'daily_login',
    title: '每日登入',
    description: '每天登入系統即可獲得 Z幣',
    emoji: '📅',
    reward: 2,
    maxCompletions: 1,
  },
  {
    id: 'complete_survey',
    title: '完成一份問卷',
    description: '填完任意一份問卷',
    emoji: '✅',
    reward: 1,
    maxCompletions: 5,
  },
  {
    id: 'share_result',
    title: '分享結果',
    description: '將問卷結果分享給好友',
    emoji: '📤',
    reward: 5,
    maxCompletions: 3,
  },
  {
    id: 'invite_friend',
    title: '邀請好友',
    description: '透過邀請連結邀請一位新用戶',
    emoji: '🤝',
    reward: 10,
    maxCompletions: 1,
  },
  {
    id: 'watch_ad',
    title: '觀看廣告',
    description: '觀看完整廣告支持平台營運',
    emoji: '👁️',
    reward: 2,
    maxCompletions: 3,
  },
]

// ===== 型別 =====

export interface DailyTask {
  id: string
  title: string
  description: string
  emoji: string
  reward: number
  maxCompletions: number
  completionsToday: number
  isCompleted: boolean
}

interface TaskLogRow extends Record<string, unknown> {
  task_id: string
  count: string
}

// ===== 工具 =====

/** 取得今日 UTC 日期起始時間（台灣時間 +8，以 UTC+8 為基準） */
function todayStartUtc(): string {
  const now = new Date()
  // 以台灣時區午夜為基準：UTC+8，所以 UTC 時間減去 8 小時後取日期
  const tzOffset = 8 * 60 * 60 * 1000
  const twNow = new Date(now.getTime() + tzOffset)
  const twDate = twNow.toISOString().slice(0, 10) // 'YYYY-MM-DD'
  // 台灣時間的今日開始 = UTC 的 (twDate - 8h)
  return `${twDate}T16:00:00.000Z` // 前一日 UTC 16:00 = 台灣時間今日 00:00
    .replace(
      /^(\d{4}-\d{2}-\d{2})T/,
      () => {
        // 計算前一天
        const d = new Date(`${twDate}T00:00:00+08:00`)
        d.setUTCHours(d.getUTCHours() - 8)
        return d.toISOString().slice(0, 11)
      }
    )
}

/** 計算今日已完成次數（按 task_id 分組） */
async function getTodayCompletions(userId: string): Promise<Map<string, number>> {
  const rows = await query<TaskLogRow>(
    `SELECT task_id, COUNT(*) as count
     FROM daily_task_logs
     WHERE user_id = $1
       AND completed_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '8 hours'
       AND completed_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei'
     GROUP BY task_id`,
    [userId]
  )
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.task_id, parseInt(row.count as string, 10))
  }
  return map
}

// ===== 公開 API =====

/** 取得當前用戶的每日任務列表（含今日完成次數） */
export async function getDailyTasks(userId: string): Promise<DailyTask[]> {
  const completions = await getTodayCompletions(userId)

  return DAILY_TASKS.map((task) => {
    const completionsToday = completions.get(task.id) ?? 0
    return {
      ...task,
      completionsToday,
      isCompleted: completionsToday >= task.maxCompletions,
    }
  })
}

/** 完成一個任務，獎勵 Z幣 */
export async function completeTask(
  userId: string,
  taskId: string,
  tenantId?: string
): Promise<{ success: boolean; earned: number; message: string }> {
  const taskConfig = DAILY_TASKS.find((t) => t.id === taskId)
  if (!taskConfig) {
    return { success: false, earned: 0, message: '無效的任務 ID' }
  }

  const completions = await getTodayCompletions(userId)
  const completionsToday = completions.get(taskId) ?? 0

  if (completionsToday >= taskConfig.maxCompletions) {
    return {
      success: false,
      earned: 0,
      message: `今日已達上限（${taskConfig.maxCompletions} 次）`,
    }
  }

  // 記錄完成
  await execute(
    `INSERT INTO daily_task_logs (user_id, task_id) VALUES ($1, $2)`,
    [userId, taskId]
  )

  // 取得錢包並獎勵 Z幣
  const wallet = await getOrCreateWallet({ userId, tenantId })

  await execute(
    `UPDATE zcoin_wallets
     SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
     WHERE id = $2`,
    [taskConfig.reward, wallet.id]
  )

  // reason 對應 zcoin_transactions 的 earn reason（任務 ID 映射到 reason）
  const reasonMap: Record<string, string> = {
    daily_login: 'daily_login',
    complete_survey: 'survey_complete',
    share_result: 'share',
    invite_friend: 'invite',
    watch_ad: 'daily_login', // 廣告觀看歸類到 daily_login
  }
  const txReason = reasonMap[taskId] ?? 'daily_login'

  await execute(
    `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
     VALUES ($1, $2, 'earn', $3, $4)`,
    [wallet.id, taskConfig.reward, txReason, taskId]
  )

  return {
    success: true,
    earned: taskConfig.reward,
    message: `完成任務「${taskConfig.title}」，獲得 ${taskConfig.reward} Z幣！`,
  }
}

/** 取得今日任務統計 */
export async function getDailyTaskStats(userId: string): Promise<{
  completedToday: number
  totalToday: number
  earnedToday: number
}> {
  const tasks = await getDailyTasks(userId)

  const completedToday = tasks.filter((t) => t.isCompleted).length
  const totalToday = tasks.length

  // 計算今日已賺取的 Z幣（從任務記錄計算）
  const earnedResult = await query<{ earned: string }>(
    `SELECT COALESCE(SUM(
       CASE dtl.task_id
         ${DAILY_TASKS.map((t) => `WHEN '${t.id}' THEN ${t.reward}`).join(' ')}
         ELSE 0
       END
     ), 0) as earned
     FROM daily_task_logs dtl
     WHERE dtl.user_id = $1
       AND dtl.completed_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei'`,
    [userId]
  )

  const earnedToday = parseInt(earnedResult[0]?.earned ?? '0', 10)

  return { completedToday, totalToday, earnedToday }
}

// lib/proactive/pushEngine.ts — 雪凜主動推送引擎

import { queryOne, execute } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'
import { createTask } from '@/lib/scheduler/taskScheduler'

export interface PushMessage {
  userId: string
  lineUserId?: string   // LINE user ID（如果已知）
  channel: 'line' | 'web' | 'both'
  message: string
  mood: string
  action?: { label?: string; type: string; target: string }
  priority: 'low' | 'normal' | 'high'
  triggerType?: string
  triggerSkill?: string
}

/** 取得使用者通知偏好 */
async function getUserNotificationPrefs(userId: string): Promise<{
  proactiveEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
}> {
  try {
    const prefs = await queryOne<{
      proactive_enabled: boolean
      quiet_hours_start: number
      quiet_hours_end: number
    }>(
      `SELECT proactive_enabled, quiet_hours_start, quiet_hours_end
       FROM user_notification_prefs WHERE user_id = $1`,
      [userId]
    )
    return {
      proactiveEnabled: prefs?.proactive_enabled ?? true,
      quietHoursStart: prefs?.quiet_hours_start ?? 22,
      quietHoursEnd: prefs?.quiet_hours_end ?? 8,
    }
  } catch {
    return { proactiveEnabled: true, quietHoursStart: 22, quietHoursEnd: 8 }
  }
}

/** 取得使用者最近一次推送時間 */
async function getLastPushTime(userId: string): Promise<Date> {
  try {
    const row = await queryOne<{ created_at: string }>(
      `SELECT created_at FROM push_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    return row ? new Date(row.created_at) : new Date(0)
  } catch {
    return new Date(0)
  }
}

/** 記錄推送 */
async function logPush(push: PushMessage): Promise<void> {
  try {
    await execute(
      `INSERT INTO push_log (user_id, channel, message, mood, trigger_type, trigger_skill)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [push.userId, push.channel, push.message, push.mood, push.triggerType ?? null, push.triggerSkill ?? null]
    )
  } catch {
    // non-fatal
  }
}

/** 取得明天早上 9 點（台灣時間） */
function getNextMorning(): Date {
  const next = new Date()
  // 加 8 小時（UTC+8 近似）後找到明天 09:00
  next.setDate(next.getDate() + 1)
  next.setHours(1, 0, 0, 0) // UTC 01:00 = TWN 09:00
  return next
}

/** 取得台灣當前小時（UTC+8） */
function getTaiwanHour(): number {
  return new Date().getUTCHours() + 8 < 24
    ? new Date().getUTCHours() + 8
    : new Date().getUTCHours() + 8 - 24
}

/** 從 LINE user ID 找到平台使用者 ID */
export async function getPlatformUserIdFromLineId(lineUserId: string): Promise<string | null> {
  try {
    const row = await queryOne<{ platform_user_id: string }>(
      `SELECT platform_user_id FROM line_users WHERE line_user_id = $1 AND platform_user_id IS NOT NULL`,
      [lineUserId]
    )
    return row?.platform_user_id ?? null
  } catch {
    return null
  }
}

/** 從平台使用者 ID 找到 LINE user ID */
export async function getLineUserIdFromPlatformId(userId: string): Promise<string | null> {
  try {
    const row = await queryOne<{ line_user_id: string }>(
      `SELECT line_user_id FROM line_users WHERE platform_user_id = $1`,
      [userId]
    )
    return row?.line_user_id ?? null
  } catch {
    return null
  }
}

/** 用 LINE push message 推播給特定使用者 */
export async function sendLineUserPush(
  lineUserId: string,
  messages: Array<Record<string, unknown>>
): Promise<void> {
  const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!token) return

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: lineUserId, messages }),
    })
  } catch (err) {
    console.error('[pushEngine] LINE push failed:', err)
  }
}

/** 建立雪凜風格的 Flex Message */
export function buildYukirinFlexMessage(
  message: string,
  mood: string,
  action?: { label?: string; type: string; target: string }
): Record<string, unknown> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

  return {
    type: 'flex',
    altText: `雪凜：${message.slice(0, 60)}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#1a1033',
        paddingAll: '10px',
        contents: [
          {
            type: 'text',
            text: '✦ 雪凜',
            weight: 'bold',
            size: 'sm',
            color: '#b8a9e8',
          },
          {
            type: 'text',
            text: `[${mood}]`,
            size: 'xs',
            color: '#7c6fa0',
            align: 'end',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        backgroundColor: '#1a1033',
        contents: [
          {
            type: 'text',
            text: message,
            wrap: true,
            size: 'sm',
            color: '#e2e8f0',
          },
        ],
      },
      ...(action
        ? {
            footer: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '10px',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: action.label ?? '去看看',
                    uri: `${BASE_URL}${action.target}`,
                  },
                  style: 'primary',
                  color: '#7c3aed',
                  height: 'sm',
                },
              ],
            },
          }
        : {}),
    },
  }
}

/** 主推送函式 — 會檢查偏好、冷卻、安靜時間 */
export async function sendProactivePush(push: PushMessage): Promise<void> {
  try {
    // 1. 檢查通知偏好
    const prefs = await getUserNotificationPrefs(push.userId)
    if (!prefs.proactiveEnabled) return

    // 2. 冷卻時間（非高優先：1 小時間隔）
    if (push.priority !== 'high') {
      const lastPush = await getLastPushTime(push.userId)
      const cooldownMs = 60 * 60 * 1000
      if (Date.now() - lastPush.getTime() < cooldownMs) return
    }

    // 3. 安靜時間（22:00 - 08:00 台灣時間）
    const hour = getTaiwanHour()
    const isQuiet = hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd
    if (isQuiet) {
      // 延遲到明天早上
      await createTask({
        userId: push.userId,
        type: 'delayed_push',
        executeAt: getNextMorning(),
        payload: push as unknown as Record<string, unknown>,
        channel: push.channel,
        yukirinMessage: push.message,
      })
      return
    }

    // 4. 取得 LINE user ID
    const lineUserId = push.lineUserId ?? await getLineUserIdFromPlatformId(push.userId)

    // 5. 發送
    if ((push.channel === 'line' || push.channel === 'both') && lineUserId) {
      const flexMsg = buildYukirinFlexMessage(push.message, push.mood, push.action) as Record<string, unknown>
      await sendLineUserPush(lineUserId, [flexMsg])
    }

    // 6. 記錄
    await logPush(push)
  } catch (err) {
    console.error('[pushEngine] sendProactivePush error:', err)
  }
}

import { query as dbQuery } from '@/lib/db'

const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN ?? ''
const LEGACY_ADMIN_USER_ID = process.env.LINE_YOUR_USER_ID ?? ''
const ENV_ADMIN_IDS = [
  ...new Set(
    (process.env.LINE_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .concat(LEGACY_ADMIN_USER_ID ? [LEGACY_ADMIN_USER_ID] : [])
  ),
]
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

type LineMessage = { type: string; [key: string]: unknown }

/** 從 DB 取得所有啟用的管理員 LINE user ID，合併 env 的 */
async function getAllAdminIds(): Promise<string[]> {
  try {
    const rows = await dbQuery<{ line_user_id: string }>(
      `SELECT line_user_id FROM line_admins WHERE active = true`
    )
    const dbIds = rows.map((r) => r.line_user_id)
    return [...new Set([...ENV_ADMIN_IDS, ...dbIds])]
  } catch {
    // DB 查詢失敗時 fallback 到環境變數
    return ENV_ADMIN_IDS
  }
}

/**
 * 透過 LINE Messaging API 推播訊息給所有管理員
 * 自動合併 env + DB 的管理員清單
 * 不阻塞主流程 — 錯誤只 log 不 throw
 */
export async function pushLineMessage(messages: LineMessage[]): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] Missing LINE_INSIGHT_CHANNEL_ACCESS_TOKEN')
    return
  }

  const adminIds = await getAllAdminIds()
  if (adminIds.length === 0) {
    console.warn('[LINE] No admin IDs configured')
    return
  }

  try {
    const results = await Promise.allSettled(
      adminIds.map(async (userId) => {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ to: userId, messages }),
          signal: AbortSignal.timeout(10000),
        })

        if (!res.ok) {
          const body = await res.text()
          console.error(`[LINE] Push failed (${res.status}) for ${userId}:`, body)
        }
      })
    )

    const rejected = results.filter((r) => r.status === 'rejected')
    if (rejected.length > 0) {
      console.error(`[LINE] Push error count: ${rejected.length}`)
    }
  } catch (err) {
    console.error('[LINE] Push error:', err)
  }
}

/** 簡單文字推播（向下相容） */
export async function pushText(text: string): Promise<void> {
  return pushLineMessage([{ type: 'text', text }])
}

/**
 * 問卷送出時推播 Flex Message 通知
 */
export function notifySurveySubmitted(params: {
  responseId: string
  surveySlug: string
  answersCount: number
}): void {
  const flexMessage: LineMessage = {
    type: 'flex',
    altText: `📋 新問卷回覆 — ${params.surveySlug}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0e7990',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: '📋 新問卷回覆！', color: '#ffffff', weight: 'bold', size: 'lg' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: '問卷', color: '#8b8b8b', size: 'sm', flex: 2 },
            { type: 'text', text: params.surveySlug, color: '#333333', size: 'sm', flex: 5, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: '回答數', color: '#8b8b8b', size: 'sm', flex: 2 },
            { type: 'text', text: `${params.answersCount} 題`, color: '#333333', size: 'sm', flex: 5 },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ID', color: '#8b8b8b', size: 'sm', flex: 2 },
            { type: 'text', text: params.responseId.slice(0, 8) + '...', color: '#999999', size: 'xs', flex: 5 },
          ]},
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '查看詳情',
              uri: `${BASE_URL}/admin/responses/${params.responseId}`,
            },
            style: 'primary',
            color: '#0e7990',
          },
        ],
      },
    },
  }

  pushLineMessage([flexMessage]).catch(() => {})
}

/**
 * 加入封測名單時推播 Flex Message 通知
 */
export function notifyWaitlistJoined(params: {
  email: string
  nickname?: string
}): void {
  const flexMessage: LineMessage = {
    type: 'flex',
    altText: `🎉 新封測申請 — ${params.email}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#047e57',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: '🎉 新封測申請！', color: '#ffffff', weight: 'bold', size: 'lg' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'Email', color: '#8b8b8b', size: 'sm', flex: 2 },
            { type: 'text', text: params.email, color: '#333333', size: 'sm', flex: 5, wrap: true },
          ]},
          ...(params.nickname ? [{ type: 'box' as const, layout: 'horizontal' as const, contents: [
            { type: 'text' as const, text: '暱稱', color: '#8b8b8b', size: 'sm' as const, flex: 2 },
            { type: 'text' as const, text: params.nickname, color: '#333333', size: 'sm' as const, flex: 5 },
          ]}] : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '查看名單', uri: `${BASE_URL}/admin/waitlist` },
            style: 'primary',
            color: '#047e57',
          },
        ],
      },
    },
  }

  pushLineMessage([flexMessage]).catch(() => {})
}

/**
 * 使用官方帳號廣播訊息給所有好友
 */
export async function broadcastMessage(messages: LineMessage[]): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN ?? ''
  if (!token) return { ok: false, error: 'Missing LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN' }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/**
 * 使用官方帳號推播給特定使用者
 */
export async function pushToUser(userId: string, messages: LineMessage[]): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN ?? ''
  if (!token) return { ok: false, error: 'Missing LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN' }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

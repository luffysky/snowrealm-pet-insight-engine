/**
 * LINE 推播核心模組
 *
 * Bot 分工：
 *   Insight Bot  → 管理員通知（pushLineMessage）
 *   Official Bot → 用戶通知（pushToUser / broadcastMessage）
 */

import { query as dbQuery } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

export type LineMessage = { type: string; [key: string]: unknown }

// ━━━━━━━━━━━━━━━━━ 管理員 ID ━━━━━━━━━━━━━━━━━

/**
 * 取得所有啟用中的管理員 LINE user ID
 * 合併 ENV ADMIN_USER_ID + DB line_admins，trim + Set 去重
 */
async function getAllAdminIds(): Promise<string[]> {
  const envId = (await getLineConfig('ADMIN_USER_ID') ?? '').trim()
  const envIds = envId ? [envId] : []
  try {
    const rows = await dbQuery<{ line_user_id: string }>(
      `SELECT line_user_id FROM line_admins WHERE active = true`
    )
    const dbIds = rows.map((r) => r.line_user_id.trim()).filter(Boolean)
    return [...new Set([...envIds, ...dbIds])]
  } catch {
    return envIds
  }
}

// ━━━━━━━━━━━━━━━━━ Insight Bot 推播（管理員）━━━━━━━━━━━━━━━━━

/**
 * 透過 Insight Bot 推播訊息給所有管理員
 * 不阻塞主流程 — 錯誤只 log 不 throw
 */
export async function pushLineMessage(messages: LineMessage[]): Promise<void> {
  const token = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!token) {
    console.warn('[LINE Insight] Missing INSIGHT_CHANNEL_ACCESS_TOKEN')
    return
  }

  const adminIds = await getAllAdminIds()
  if (adminIds.length === 0) {
    console.warn('[LINE Insight] No admin IDs configured')
    return
  }

  const results = await Promise.allSettled(
    adminIds.map((userId) =>
      fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: userId, messages }),
        signal: AbortSignal.timeout(10000),
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(`[LINE Insight] Push failed (${res.status}) for ${userId}:`, body)
        }
      })
    )
  )

  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length > 0) console.error('[LINE Insight] Push errors:', failed.length)
}

/** 簡單文字推播給管理員（向下相容） */
export async function pushText(text: string): Promise<void> {
  return pushLineMessage([{ type: 'text', text }])
}

// ━━━━━━━━━━━━━━━━━ Flex Message 構建 ━━━━━━━━━━━━━━━━━

function now(): string {
  return new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
}

function buildRow(label: string, value: string) {
  return {
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#888888', flex: 2 },
      { type: 'text', text: value, size: 'sm', color: '#1a1a1a', flex: 5, wrap: true },
    ],
  }
}

function buildFlex(opts: {
  altText: string
  headerColor: string
  headerText: string
  rows: { label: string; value: string }[]
  footerLabel: string
  footerUrl: string
}): LineMessage {
  return {
    type: 'flex',
    altText: opts.altText,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: opts.headerColor,
        paddingAll: '14px',
        contents: [
          { type: 'text', text: opts.headerText, color: '#ffffff', weight: 'bold', size: 'md' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical',
        spacing: 'sm', paddingAll: '14px',
        contents: [
          ...opts.rows.map((r) => buildRow(r.label, r.value)),
          { type: 'separator', margin: 'sm' },
          buildRow('時間', now()),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '10px',
        contents: [
          {
            type: 'button', style: 'link', height: 'sm',
            action: { type: 'uri', label: opts.footerLabel, uri: opts.footerUrl },
          },
        ],
      },
    },
  }
}

// ━━━━━━━━━━━━━━━━━ 管理員通知（事件類型）━━━━━━━━━━━━━━━━━

/**
 * 問卷送出通知（Insight Bot → 管理員）
 * 每次提交呼叫一次，不重複。
 */
export function notifySurveySubmitted(params: {
  responseId: string
  surveySlug: string
  answersCount: number
}): void {
  ;(async () => {
    const msg = buildFlex({
      altText: `📊 新填答 — ${params.surveySlug}`,
      headerColor: '#059669',
      headerText: '📊 新填答通知',
      rows: [
        { label: '問卷', value: params.surveySlug },
        { label: '回答', value: `${params.answersCount} 題` },
        { label: 'ID', value: params.responseId.slice(0, 8) + '...' },
      ],
      footerLabel: '查看回覆 →',
      footerUrl: `${BASE_URL}/insight-admin/responses/${params.responseId}`,
    })
    await pushLineMessage([msg])
  })().catch(() => {})
}

/**
 * 封測名單加入通知（Insight Bot → 管理員）
 */
export function notifyWaitlistJoined(params: {
  email: string
  nickname?: string
}): void {
  ;(async () => {
    const rows: { label: string; value: string }[] = [
      { label: 'Email', value: params.email },
    ]
    if (params.nickname) rows.push({ label: '暱稱', value: params.nickname })

    const msg = buildFlex({
      altText: `🎉 新封測申請 — ${params.email}`,
      headerColor: '#f97316',
      headerText: '🎉 新封測申請',
      rows,
      footerLabel: '查看名單 →',
      footerUrl: `${BASE_URL}/insight-admin/waitlist`,
    })
    await pushLineMessage([msg])
  })().catch(() => {})
}

// ━━━━━━━━━━━━━━━━━ Official Bot 推播（用戶）━━━━━━━━━━━━━━━━━

/**
 * 透過 Official Bot 廣播給所有好友
 */
export async function broadcastMessage(messages: LineMessage[]): Promise<{ ok: boolean; error?: string }> {
  const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!token) return { ok: false, error: 'Missing OFFICIAL_CHANNEL_ACCESS_TOKEN' }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
 * 透過 Official Bot 推播給指定用戶
 */
export async function pushToUser(userId: string, messages: LineMessage[]): Promise<{ ok: boolean; error?: string }> {
  const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!token) return { ok: false, error: 'Missing OFFICIAL_CHANNEL_ACCESS_TOKEN' }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

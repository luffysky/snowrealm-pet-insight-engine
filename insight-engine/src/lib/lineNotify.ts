/**
 * LINE Messaging API 管理員通知模組 — Flex Message 版
 *
 * 每種事件有不同的顏色主題和樣式
 */

import { getLineConfig } from '@/lib/lineConfig'
import { queryOne } from '@/lib/db'

const PUSH_URL = 'https://api.line.me/v2/bot/message/push'

export type NotifyEvent = 'registration' | 'login' | 'survey_complete' | 'weekly_report'

async function isNotifyEnabled(event: NotifyEvent, tenantId?: string): Promise<boolean> {
  if (!tenantId) return true
  try {
    const row = await queryOne<{ extra_meta: Record<string, unknown> | null }>(
      `SELECT extra_meta FROM site_settings WHERE tenant_id = $1`, [tenantId],
    )
    const prefs = row?.extra_meta as Record<string, unknown> | null
    if (!prefs) return true
    const key = `notify_${event}`
    return prefs[key] !== false
  } catch { return true }
}

// ━━━━━━━━━━━━━━━━━ 顏色主題 ━━━━━━━━━━━━━━━━━

const THEMES = {
  email_register:   { color: '#059669', emoji: '📧', label: 'Email 註冊',    headerBg: '#059669' },
  phone_register:   { color: '#7c3aed', emoji: '📱', label: '手機註冊',      headerBg: '#7c3aed' },
  google_register:  { color: '#2563eb', emoji: '🔵', label: 'Google 註冊',   headerBg: '#2563eb' },
  line_register:    { color: '#06C755', emoji: '💚', label: 'LINE 註冊',     headerBg: '#06C755' },
  password_login:   { color: '#d97706', emoji: '🔑', label: '密碼登入',      headerBg: '#d97706' },
  google_login:     { color: '#2563eb', emoji: '🔵', label: 'Google 登入',   headerBg: '#2563eb' },
  line_login:       { color: '#06C755', emoji: '💚', label: 'LINE 登入',     headerBg: '#06C755' },
} as const

// ━━━━━━━━━━━━━━━━━ Flex Message 構建 ━━━━━━━━━━━━━━━━━

function buildInfoRow(label: string, value: string) {
  return {
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#8c8c8c', flex: 2 },
      { type: 'text', text: value, size: 'sm', color: '#333333', flex: 5, wrap: true },
    ],
  }
}

function now() {
  return new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
}

interface FlexCard {
  altText: string
  headerText: string
  headerBg: string
  rows: { label: string; value: string }[]
}

function buildFlexMessage(card: FlexCard) {
  return {
    type: 'flex',
    altText: card.altText,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: card.headerBg,
        paddingAll: '16px',
        contents: [
          { type: 'text', text: card.headerText, color: '#ffffff', weight: 'bold', size: 'lg' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical',
        spacing: 'md', paddingAll: '16px',
        contents: [
          ...card.rows.map(r => buildInfoRow(r.label, r.value)),
          { type: 'separator', margin: 'md' },
          buildInfoRow('時間', now()),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'link', height: 'sm',
            action: { type: 'uri', label: '前往後台 →', uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'}/snowrealm-insight-ctrl` },
          },
        ],
      },
    },
  }
}

// ━━━━━━━━━━━━━━━━━ 推送 ━━━━━━━━━━━━━━━━━

async function pushToAdmin(message: Record<string, unknown>): Promise<void> {
  try {
    const adminUserId = await getLineConfig('ADMIN_USER_ID')
    if (!adminUserId) {
      console.log('[LINE Push] ADMIN_USER_ID 未設定，跳過通知')
      return
    }

    let token = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN')
    if (!token) token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
    if (!token) {
      console.log('[LINE Push] 無可用的 Channel Access Token，跳過通知')
      return
    }

    fetch(PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: adminUserId,
        messages: [message],
      }),
      signal: AbortSignal.timeout(10000),
    }).catch((err) => {
      console.error('[LINE Push] 發送失敗:', err)
    })
  } catch (err) {
    console.error('[LINE Push] 初始化失敗:', err)
  }
}

// ━━━━━━━━━━━━━━━━━ 公開 API ━━━━━━━━━━━━━━━━━

/** 新使用者註冊通知 */
export async function notifyNewRegistration(info: {
  method: 'email' | 'phone' | 'google' | 'line'
  email?: string
  phone?: string
  displayName?: string
  orgName?: string
  slug?: string
  tenantId?: string
}) {
  if (!await isNotifyEnabled('registration', info.tenantId)) return

  const themeKey = `${info.method}_register` as keyof typeof THEMES
  const theme = THEMES[themeKey]

  const rows: { label: string; value: string }[] = []
  rows.push({ label: '方式', value: `${theme.emoji} ${theme.label}` })
  if (info.displayName) rows.push({ label: '姓名', value: info.displayName })
  if (info.email) rows.push({ label: 'Email', value: info.email })
  if (info.phone) rows.push({ label: '手機', value: info.phone })
  if (info.orgName) rows.push({ label: '組織', value: info.orgName })
  if (info.slug) rows.push({ label: '後台', value: `/insight-admin/${info.slug}` })

  pushToAdmin(buildFlexMessage({
    altText: `🎉 新使用者註冊：${info.displayName || info.email || info.phone || '未知'}`,
    headerText: `🎉 新使用者註冊`,
    headerBg: theme.headerBg,
    rows,
  }))
}

/** 使用者登入通知 */
export async function notifyUserLogin(info: {
  method: 'password' | 'google' | 'line'
  identifier: string
  displayName?: string
  tenantId?: string
}) {
  if (!await isNotifyEnabled('login', info.tenantId)) return

  const themeKey = `${info.method}_login` as keyof typeof THEMES
  const theme = THEMES[themeKey]

  const rows: { label: string; value: string }[] = []
  rows.push({ label: '方式', value: `${theme.emoji} ${theme.label}` })
  rows.push({ label: '帳號', value: info.identifier })
  if (info.displayName) rows.push({ label: '姓名', value: info.displayName })
  if (info.tenantId) rows.push({ label: '租戶', value: info.tenantId })

  pushToAdmin(buildFlexMessage({
    altText: `👤 使用者登入：${info.displayName || info.identifier}`,
    headerText: `👤 使用者登入`,
    headerBg: theme.headerBg,
    rows,
  }))
}

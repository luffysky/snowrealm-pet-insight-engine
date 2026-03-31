/**
 * LINE Messaging API 管理員通知模組 — Flex Message 版
 *
 * 每種事件有不同的顏色主題和樣式
 */

import { getLineConfig } from '@/lib/lineConfig'
import { queryOne } from '@/lib/db'

const PUSH_URL = 'https://api.line.me/v2/bot/message/push'

export type NotifyEvent = 'registration' | 'login' | 'survey_complete' | 'weekly_report' | 'report' | 'new_post' | 'new_user'

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

// ━━━━━━━━━━━━━━━━━ 社群監控通知 ━━━━━━━━━━━━━━━━━

const REASON_LABELS: Record<string, string> = {
  spam:          '🗑️ 垃圾訊息',
  fraud:         '🚨 詐騙',
  harassment:    '😡 騷擾/霸凌',
  inappropriate: '🔞 不當內容',
  violence:      '⚔️ 暴力',
  privacy:       '🔏 侵犯隱私',
  copyright:     '©️ 侵犯著作權',
  other:         '❓ 其他',
}

const TARGET_LABELS: Record<string, string> = {
  post:    '貼文',
  comment: '留言',
  user:    '用戶',
  message: '私訊',
}

/** 用戶檢舉通知 — 立即推送給總管理員 */
export async function notifyReport(info: {
  reporterName: string
  targetType: string
  targetId: string
  targetContent?: string
  targetAuthorName?: string
  reason: string
  description?: string
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'
  const rows: { label: string; value: string }[] = [
    { label: '舉報人', value: info.reporterName },
    { label: '目標類型', value: TARGET_LABELS[info.targetType] ?? info.targetType },
    { label: '原因', value: REASON_LABELS[info.reason] ?? info.reason },
  ]
  if (info.targetAuthorName) rows.push({ label: '被舉報人', value: info.targetAuthorName })
  if (info.targetContent) rows.push({ label: '內容摘要', value: info.targetContent.slice(0, 80) })
  if (info.description) rows.push({ label: '補充說明', value: info.description.slice(0, 100) })

  const adminUserId = await getLineConfig('ADMIN_USER_ID')
  if (!adminUserId) return
  let token = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN')
  if (!token) token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
  if (!token) return

  const message = {
    type: 'flex',
    altText: `🚨 新檢舉：${REASON_LABELS[info.reason] ?? info.reason} — ${info.reporterName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#dc2626',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: '🚨 用戶檢舉通知', color: '#ffffff', weight: 'bold', size: 'lg' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical',
        spacing: 'md', paddingAll: '16px',
        contents: [
          ...rows.map(r => buildInfoRow(r.label, r.value)),
          { type: 'separator', margin: 'md' },
          buildInfoRow('時間', now()),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'primary', height: 'sm',
            color: '#dc2626',
            action: { type: 'uri', label: '前往審查 →', uri: `${baseUrl}/snowrealm-insight-ctrl/social?tab=reports` },
          },
        ],
      },
    },
  }

  fetch(PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: adminUserId, messages: [message] }),
    signal: AbortSignal.timeout(10000),
  }).catch(err => console.error('[notifyReport] LINE push failed:', err))
}

/** 新貼文/新用戶活動通知（可選，由呼叫端控制是否推送） */
export async function notifyActivity(info: {
  type: 'new_post' | 'new_user'
  actorName: string
  summary: string
  link?: string
}): Promise<void> {
  const adminUserId = await getLineConfig('ADMIN_USER_ID')
  if (!adminUserId) return
  let token = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN')
  if (!token) token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
  if (!token) return

  const emoji = info.type === 'new_post' ? '📝' : '👤'
  const label = info.type === 'new_post' ? '新貼文發布' : '新用戶加入'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'

  const message = buildFlexMessage({
    altText: `${emoji} ${label}：${info.actorName}`,
    headerText: `${emoji} ${label}`,
    headerBg: info.type === 'new_post' ? '#7c3aed' : '#059669',
    rows: [
      { label: '用戶', value: info.actorName },
      { label: '內容', value: info.summary.slice(0, 100) },
      ...(info.link ? [{ label: '連結', value: info.link }] : []),
    ],
  })
  // Override footer link for social monitor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(message as any).contents.footer.contents[0].action.uri = `${baseUrl}/snowrealm-insight-ctrl/social`

  fetch(PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: adminUserId, messages: [message] }),
    signal: AbortSignal.timeout(10000),
  }).catch(err => console.error('[notifyActivity] LINE push failed:', err))
}

// ━━━━━━━━━━━━━━━━━ Rich Menu ━━━━━━━━━━━━━━━━━

/**
 * 新好友加入時設定預設 Rich Menu（選單 A）
 * Key: DEFAULT_RICH_MENU_ID
 */
export async function setDefaultRichMenu(lineUserId: string, tenantId?: string): Promise<void> {
  try {
    const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN', tenantId)
    const menuId = await getLineConfig('DEFAULT_RICH_MENU_ID', tenantId)
    if (!token || !menuId) return

    await fetch(`https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${menuId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.error('[setDefaultRichMenu] Failed:', err)
  }
}

/**
 * 切換 LINE 用戶的 Rich Menu（填完問卷後）
 * Rich Menu ID 從 line_configs 讀取
 * Key: POST_SURVEY_RICH_MENU_ID（存於 site_settings 或 ENV POST_SURVEY_RICH_MENU_ID）
 */
export async function switchUserRichMenu(lineUserId: string, tenantId?: string): Promise<void> {
  try {
    const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN', tenantId)
    const menuId = await getLineConfig('POST_SURVEY_RICH_MENU_ID', tenantId)
    if (!token || !menuId) return

    await fetch(`https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${menuId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.error('[switchUserRichMenu] Failed:', err)
  }
}

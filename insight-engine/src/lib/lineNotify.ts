/**
 * LINE Messaging API 管理員通知模組
 *
 * 使用 LINE Messaging API pushMessage 推送通知到管理員的私人 LINE
 *
 * 需要的設定（透過 line-settings 頁面或 .env.local）：
 * - ADMIN_USER_ID：你的 LINE User ID（在 LINE Developers Console 可查到）
 * - INSIGHT_CHANNEL_ACCESS_TOKEN 或 OFFICIAL_CHANNEL_ACCESS_TOKEN
 */

import { getLineConfig } from '@/lib/lineConfig'

const PUSH_URL = 'https://api.line.me/v2/bot/message/push'

/**
 * 用 LINE Messaging API 推送通知給管理員（非阻塞）
 */
async function pushToAdmin(message: string): Promise<void> {
  try {
    const adminUserId = await getLineConfig('ADMIN_USER_ID')
    if (!adminUserId) {
      console.log('[LINE Push] ADMIN_USER_ID 未設定，跳過通知')
      return
    }

    // 優先用 Insight 帳號，備援用 Official 帳號
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
        messages: [{ type: 'text', text: message }],
      }),
      signal: AbortSignal.timeout(10000),
    }).catch((err) => {
      console.error('[LINE Push] 發送失敗:', err)
    })
  } catch (err) {
    console.error('[LINE Push] 初始化失敗:', err)
  }
}

// ━━━━━━━━━━━━━━━━━━ 通知樣板 ━━━━━━━━━━━━━━━━━━

function now() {
  return new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
}

/** 新使用者註冊通知 */
export function notifyNewRegistration(info: {
  method: 'email' | 'phone' | 'google' | 'line'
  email?: string
  phone?: string
  displayName?: string
  orgName?: string
  slug?: string
}) {
  const methodLabel: Record<string, string> = {
    email: '📧 Email 註冊',
    phone: '📱 手機註冊',
    google: '🔵 Google 註冊',
    line: '💚 LINE 註冊',
  }

  const lines = [
    '🎉 新使用者註冊！',
    '━━━━━━━━━━━━━━',
    `方式：${methodLabel[info.method] || info.method}`,
  ]

  if (info.displayName) lines.push(`姓名：${info.displayName}`)
  if (info.email) lines.push(`Email：${info.email}`)
  if (info.phone) lines.push(`手機：${info.phone}`)
  if (info.orgName) lines.push(`組織：${info.orgName}`)
  if (info.slug) lines.push(`後台：/insight-admin/${info.slug}`)
  lines.push(`時間：${now()}`)

  pushToAdmin(lines.join('\n'))
}

/** 使用者登入通知 */
export function notifyUserLogin(info: {
  method: 'password' | 'google' | 'line'
  identifier: string
  displayName?: string
  tenantId?: string
}) {
  const methodLabel: Record<string, string> = {
    password: '🔑 密碼登入',
    google: '🔵 Google 登入',
    line: '💚 LINE 登入',
  }

  const lines = [
    '👤 使用者登入',
    '━━━━━━━━━━━━━━',
    `方式：${methodLabel[info.method] || info.method}`,
    `帳號：${info.identifier}`,
  ]

  if (info.displayName) lines.push(`姓名：${info.displayName}`)
  if (info.tenantId) lines.push(`租戶：${info.tenantId}`)
  lines.push(`時間：${now()}`)

  pushToAdmin(lines.join('\n'))
}

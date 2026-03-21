/**
 * LINE Notify 管理員通知模組
 *
 * 環境變數：
 * - LINE_NOTIFY_TOKEN：LINE Notify 個人存取權杖
 *   取得方式：https://notify-bot.line.me/my/ → 發行權杖 → 選擇「透過 1 對 1 聊天接收」
 *
 * 用途：有人註冊或登入平台時通知管理員
 */

const LINE_NOTIFY_URL = 'https://notify-api.line.me/api/notify'

/**
 * 發送 LINE Notify 通知（非阻塞）
 */
export async function sendLineNotify(message: string): Promise<void> {
  const token = process.env.LINE_NOTIFY_TOKEN
  if (!token) {
    console.log('[LINE Notify] TOKEN 未設定，跳過通知')
    return
  }

  fetch(LINE_NOTIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({ message }),
    signal: AbortSignal.timeout(10000),
  }).catch((err) => {
    console.error('[LINE Notify] 發送失敗:', err)
  })
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
    '\n🎉 新使用者註冊！',
    `━━━━━━━━━━━━━━`,
    `方式：${methodLabel[info.method] || info.method}`,
  ]

  if (info.displayName) lines.push(`姓名：${info.displayName}`)
  if (info.email) lines.push(`Email：${info.email}`)
  if (info.phone) lines.push(`手機：${info.phone}`)
  if (info.orgName) lines.push(`組織：${info.orgName}`)
  if (info.slug) lines.push(`後台：/insight-admin/${info.slug}`)
  lines.push(`時間：${now()}`)

  sendLineNotify(lines.join('\n'))
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
    '\n👤 使用者登入',
    `━━━━━━━━━━━━━━`,
    `方式：${methodLabel[info.method] || info.method}`,
    `帳號：${info.identifier}`,
  ]

  if (info.displayName) lines.push(`姓名：${info.displayName}`)
  if (info.tenantId) lines.push(`租戶：${info.tenantId}`)
  lines.push(`時間：${now()}`)

  sendLineNotify(lines.join('\n'))
}

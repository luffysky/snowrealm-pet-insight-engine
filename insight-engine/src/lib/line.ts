const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN ?? ''
const YOUR_USER_ID = process.env.LINE_YOUR_USER_ID ?? ''

interface LineMessage {
  type: 'text'
  text: string
}

/**
 * 透過 LINE Messaging API 推播訊息給管理員
 * 不阻塞主流程 — 錯誤只 log 不 throw
 */
export async function pushLineMessage(text: string): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN || !YOUR_USER_ID) {
    console.warn('[LINE] Missing LINE_INSIGHT_CHANNEL_ACCESS_TOKEN or LINE_YOUR_USER_ID')
    return
  }

  const messages: LineMessage[] = [{ type: 'text', text }]

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: YOUR_USER_ID, messages }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[LINE] Push failed (${res.status}):`, body)
    }
  } catch (err) {
    console.error('[LINE] Push error:', err)
  }
}

/**
 * 問卷送出時推播通知
 */
export function notifySurveySubmitted(params: {
  responseId: string
  surveySlug: string
  answersCount: number
}): void {
  const text = [
    '📋 新問卷回覆！',
    `問卷：${params.surveySlug}`,
    `回答數：${params.answersCount} 題`,
    `Response ID：${params.responseId}`,
  ].join('\n')

  pushLineMessage(text).catch(() => {})
}

/**
 * 加入封測名單時推播通知
 */
export function notifyWaitlistJoined(params: {
  email: string
  nickname?: string
}): void {
  const lines = ['🎉 新封測申請！', `Email：${params.email}`]
  if (params.nickname) lines.push(`暱稱：${params.nickname}`)

  pushLineMessage(lines.join('\n')).catch(() => {})
}

import { query } from './db'

interface WebhookConfig extends Record<string, unknown> {
  id: string
  event_type: string
  url: string
  active: boolean
}

/**
 * 根據事件類型查找啟用的 webhook，逐一 POST 通知
 * 不阻塞主流程 — 錯誤只 log 不 throw
 */
export async function fireWebhooks(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const configs = await query<WebhookConfig>(
    `SELECT id, event_type, url, active FROM webhook_configs WHERE event_type = $1 AND active = true`,
    [eventType]
  )

  for (const config of configs) {
    // 驗證 URL 為 https
    let parsed: URL
    try {
      parsed = new URL(config.url)
    } catch {
      console.warn(`[webhook] Invalid URL: ${config.url}`)
      continue
    }
    if (parsed.protocol !== 'https:') {
      console.warn(`[webhook] Non-HTTPS URL skipped: ${config.url}`)
      continue
    }

    fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
      signal: AbortSignal.timeout(10000),
    }).catch((err) => {
      console.error(`[webhook] Failed to fire ${eventType} to ${config.url}:`, err)
    })
  }
}

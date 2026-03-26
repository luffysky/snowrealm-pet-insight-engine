import { query, queryOne, execute } from './db'

interface SubscriptionRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  plan: string
  status: string
  period: string
  current_period_end: string | null
  auto_renew: boolean
  cancel_at: string | null
  cancel_reason: string | null
}

/** 升級/開通方案（付款成功後呼叫） */
export async function upgradePlan(params: {
  tenantId: string
  plan: string
  period: string
  tradeNo: string
  amount: number
  paymentId?: string
}): Promise<void> {
  const { tenantId, plan, period, tradeNo, amount } = params
  const now = new Date()
  const periodEnd = new Date(now)
  if (period === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  await execute(
    `INSERT INTO subscriptions
       (tenant_id, plan, status, period, current_period_start, current_period_end, newebpay_trade_no, amount, auto_renew, cancel_at, cancel_reason, updated_at)
     VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, true, NULL, NULL, NOW())
     ON CONFLICT (tenant_id)
     DO UPDATE SET
       plan = $2, status = 'active', period = $3,
       current_period_start = $4, current_period_end = $5,
       newebpay_trade_no = $6, amount = $7,
       auto_renew = true, cancel_at = NULL, cancel_reason = NULL,
       updated_at = NOW()`,
    [tenantId, plan, period, now.toISOString(), periodEnd.toISOString(), tradeNo, amount]
  )
}

/** 取消訂閱（設定期末取消，不立即降級） */
export async function cancelSubscription(params: {
  tenantId: string
  reason?: string
}): Promise<void> {
  const { tenantId, reason } = params
  // 取得目前 period_end 作為 cancel_at
  const sub = await queryOne<SubscriptionRow>(
    `SELECT current_period_end FROM subscriptions WHERE tenant_id = $1`,
    [tenantId]
  )
  const cancelAt = sub?.current_period_end ?? new Date().toISOString()
  await execute(
    `UPDATE subscriptions
     SET auto_renew = false, cancel_at = $1, cancel_reason = $2, updated_at = NOW()
     WHERE tenant_id = $3`,
    [cancelAt, reason ?? null, tenantId]
  )
}

/** 恢復自動續訂 */
export async function reinstateSubscription(tenantId: string): Promise<void> {
  await execute(
    `UPDATE subscriptions
     SET auto_renew = true, cancel_at = NULL, cancel_reason = NULL, updated_at = NOW()
     WHERE tenant_id = $1`,
    [tenantId]
  )
}

/** 檢查已過期訂閱並降級為 free */
export async function checkExpiredSubscriptions(): Promise<number> {
  const now = new Date().toISOString()
  const expired = await query<{ tenant_id: string }>(
    `SELECT tenant_id FROM subscriptions
     WHERE status = 'active'
       AND current_period_end IS NOT NULL
       AND current_period_end < $1`,
    [now]
  )
  if (expired.length === 0) return 0

  for (const row of expired) {
    await execute(
      `UPDATE subscriptions SET plan = 'free', status = 'expired', updated_at = NOW()
       WHERE tenant_id = $1`,
      [row.tenant_id]
    )
    // 同步到 tenants 表
    await execute(
      `UPDATE tenants SET plan = 'free' WHERE slug = $1`,
      [row.tenant_id]
    ).catch(() => {})
  }
  return expired.length
}

/** 取得 3 天後到期、尚未發提醒的訂閱 */
export async function getSubscriptionsNeedingReminder(): Promise<Array<{ tenantId: string; periodEnd: string }>> {
  const threeDaysLater = new Date()
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const now = new Date().toISOString()

  const rows = await query<{ tenant_id: string; current_period_end: string }>(
    `SELECT tenant_id, current_period_end FROM subscriptions
     WHERE status = 'active'
       AND auto_renew = false
       AND current_period_end IS NOT NULL
       AND current_period_end <= $1
       AND current_period_end > $2
       AND (reminder_sent_at IS NULL OR reminder_sent_at < NOW() - INTERVAL '6 days')`,
    [threeDaysLater.toISOString(), now]
  )
  return rows.map(r => ({ tenantId: r.tenant_id, periodEnd: r.current_period_end }))
}

/** 記錄提醒已發送 */
export async function markReminderSent(tenantId: string): Promise<void> {
  await execute(
    `UPDATE subscriptions SET reminder_sent_at = NOW() WHERE tenant_id = $1`,
    [tenantId]
  )
}

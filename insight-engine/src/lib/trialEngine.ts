/**
 * 免費試用機制
 * 管理租戶的試用期狀態
 */
import { queryOne, execute } from '@/lib/db'

export type PlanStatus = 'trial' | 'trial_expired' | 'active' | 'past_due' | 'cancelled'

interface TenantPlanRow extends Record<string, unknown> {
  plan: string
  trial_started_at: string | null
  trial_expires_at: string | null
}

export interface TrialStatus {
  status: PlanStatus
  daysRemaining: number   // -1 表示無限制（付費方案）
  isExpired: boolean
  canAccessAI: boolean
  canAccessAdvanced: boolean
}

const TRIAL_DURATION_DAYS = 30
const PAID_PLANS = new Set(['paid', 'pro', 'business'])

/**
 * 取得租戶的試用狀態
 */
export async function getTrialStatus(tenantId: string): Promise<TrialStatus> {
  const row = await queryOne<TenantPlanRow>(
    `SELECT plan, trial_started_at, trial_expires_at FROM tenants WHERE slug = $1`,
    [tenantId]
  )

  if (!row) {
    return buildTrialStatus(TRIAL_DURATION_DAYS, false)
  }

  if (PAID_PLANS.has(row.plan)) {
    return { status: 'active', daysRemaining: -1, isExpired: false, canAccessAI: true, canAccessAdvanced: true }
  }

  if (!row.trial_expires_at) {
    return buildTrialStatus(TRIAL_DURATION_DAYS, false)
  }

  const expiresAt = new Date(row.trial_expires_at)
  const now = new Date()
  const msRemaining = expiresAt.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
  const isExpired = msRemaining <= 0

  return buildTrialStatus(daysRemaining, isExpired)
}

function buildTrialStatus(daysRemaining: number, isExpired: boolean): TrialStatus {
  return {
    status: isExpired ? 'trial_expired' : 'trial',
    daysRemaining,
    isExpired,
    canAccessAI: !isExpired,
    canAccessAdvanced: !isExpired,
  }
}

/**
 * 初始化新租戶的 30 天試用期（註冊後呼叫）
 * 使用 WHERE trial_started_at IS NULL 避免重複初始化
 */
export async function initTenantTrial(tenantId: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS)

  await execute(
    `UPDATE tenants SET
      trial_started_at = NOW(),
      trial_expires_at = $1,
      plan = 'trial'
     WHERE slug = $2 AND trial_started_at IS NULL`,
    [expiresAt.toISOString(), tenantId]
  )
}

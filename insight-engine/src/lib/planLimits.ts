import { queryOne } from '@/lib/db'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

export const PLAN_LIMITS = {
  // B端方案
  free:       { responses: 1000,  surveys: 3,  admins: 1,  aiDaily: 3,  webhooks: 1,  name: '免費版',   price: 0 },
  pro:        { responses: 10000, surveys: -1, admins: 5,  aiDaily: 50, webhooks: 10, name: '專業版',   price: 490 },
  business:   { responses: 50000, surveys: -1, admins: -1, aiDaily: -1, webhooks: -1, name: '商業版',   price: 1290 },
  enterprise: { responses: -1,    surveys: -1, admins: -1, aiDaily: -1, webhooks: -1, name: '企業版',   price: 0 },
  // C端個人方案
  c_pro:      { responses: -1,    surveys: -1, admins: 1,  aiDaily: 20, webhooks: 0,  name: 'Pro',      price: 149 },
  c_plus:     { responses: -1,    surveys: -1, admins: 1,  aiDaily: 50, webhooks: 0,  name: 'Plus',     price: 399 },
  c_premium:  { responses: -1,    surveys: -1, admins: 1,  aiDaily: -1, webhooks: 0,  name: 'Premium',  price: 799 },
} as const

/**
 * 總後台「平台禮遇／合作夥伴」帳號：本人操作時視為無上限（與 enterprise 數值一致，名稱獨立）
 */
export const PLATFORM_PARTNER_EFFECTIVE_LIMITS = {
  responses: -1,
  surveys: -1,
  admins: -1,
  aiDaily: -1,
  webhooks: -1,
  name: '平台禮遇',
  price: 0,
} as const

const UNLIMITED = { allowed: true, used: 0, limit: -1 } as const

export type PlanKey = keyof typeof PLAN_LIMITS

export interface TenantPlan {
  plan: PlanKey
  status: string
  periodEnd: string | null
}

interface SubscriptionRow extends Record<string, unknown> {
  plan: string
  status: string
  current_period_end: string | null
}

export async function getTenantPlan(tenantId: string): Promise<TenantPlan> {
  try {
    const row = await queryOne<SubscriptionRow>(
      `SELECT plan, status, current_period_end FROM subscriptions WHERE tenant_id = $1`,
      [tenantId]
    )
    if (!row) return { plan: 'free', status: 'active', periodEnd: null }
    return {
      plan: (row.plan as PlanKey) || 'free',
      status: row.status,
      periodEnd: row.current_period_end,
    }
  } catch {
    // 尚未建立 subscriptions 表時視為免費方案
    return { plan: 'free', status: 'active', periodEnd: null }
  }
}

export function getPlanLimits(plan: PlanKey) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export function isWithinLimit(current: number, limit: number): boolean {
  return limit === -1 || current < limit
}

interface CountRow extends Record<string, unknown> {
  count: string
}

export async function checkResponseLimit(
  tenantId: string,
  userId?: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (userId && await isUserPlatformUnlimited(userId)) return { ...UNLIMITED }
  const { plan } = await getTenantPlan(tenantId)
  const limits = getPlanLimits(plan)
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::TEXT AS count FROM responses r
     JOIN surveys s ON r.survey_id = s.id
     WHERE s.tenant_id = $1
     AND r.submitted_at >= date_trunc('month', CURRENT_TIMESTAMP)`,
    [tenantId]
  )
  const used = parseInt(row?.count ?? '0', 10)
  return { allowed: isWithinLimit(used, limits.responses), used, limit: limits.responses }
}

export async function checkSurveyLimit(
  tenantId: string,
  userId?: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (userId && await isUserPlatformUnlimited(userId)) return { ...UNLIMITED }
  const { plan } = await getTenantPlan(tenantId)
  const limits = getPlanLimits(plan)
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::TEXT AS count FROM surveys WHERE tenant_id = $1`,
    [tenantId]
  )
  const used = parseInt(row?.count ?? '0', 10)
  return { allowed: isWithinLimit(used, limits.surveys), used, limit: limits.surveys }
}

export async function checkAdminLimit(
  tenantId: string,
  userId?: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (userId && await isUserPlatformUnlimited(userId)) return { ...UNLIMITED }
  const { plan } = await getTenantPlan(tenantId)
  const limits = getPlanLimits(plan)
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::TEXT AS count FROM tenant_users WHERE tenant_id = $1`,
    [tenantId]
  )
  const used = parseInt(row?.count ?? '0', 10)
  return { allowed: isWithinLimit(used, limits.admins), used, limit: limits.admins }
}

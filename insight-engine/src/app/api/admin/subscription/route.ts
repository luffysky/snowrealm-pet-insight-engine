import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, queryOne } from '@/lib/db'
import { getTenantPlan, getPlanLimits, PLAN_LIMITS } from '@/lib/planLimits'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

export const dynamic = 'force-dynamic'

interface CountRow extends Record<string, unknown> {
  count: string
}

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId, userId } = await getTenantContext()
    const platformPartner = await isUserPlatformUnlimited(userId)

    const plan = await getTenantPlan(tenantId)
    const limits = getPlanLimits(plan.plan)

    const [responseCount, surveyCount, adminCount, aiTodayCount] = await Promise.all([
      queryOne<CountRow>(
        `SELECT COUNT(*)::TEXT AS count FROM responses r
         JOIN surveys s ON r.survey_id = s.id
         WHERE s.tenant_id = $1
         AND r.submitted_at >= date_trunc('month', CURRENT_TIMESTAMP)`,
        [tenantId]
      ).catch(() => ({ count: '0' } as CountRow)),
      queryOne<CountRow>(
        `SELECT COUNT(*)::TEXT AS count FROM surveys WHERE tenant_id = $1`,
        [tenantId]
      ).catch(() => ({ count: '0' } as CountRow)),
      queryOne<CountRow>(
        `SELECT COUNT(*)::TEXT AS count FROM tenant_users WHERE tenant_id = $1`,
        [tenantId]
      ).catch(() => ({ count: '0' } as CountRow)),
      queryOne<CountRow>(
        `SELECT COUNT(*)::TEXT AS count FROM ai_usage_logs
         WHERE tenant_id = $1 AND created_at >= CURRENT_DATE`,
        [tenantId]
      ).catch(() => ({ count: '0' } as CountRow)),
    ])

    interface PaymentRow extends Record<string, unknown> {
      id: string
      trade_no: string | null
      amount: number
      status: string
      created_at: string
    }

    let payments: PaymentRow[] = []
    try {
      payments = await query<PaymentRow>(
        `SELECT id, trade_no, amount, status, created_at
         FROM payment_logs
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [tenantId]
      )
    } catch {
      // payment_logs 表尚未建立時略過
    }

    return NextResponse.json({
      plan: plan.plan,
      planName: limits.name,
      status: plan.status,
      periodEnd: plan.periodEnd,
      platformPartner,
      usage: {
        responses: { used: parseInt(responseCount?.count ?? '0', 10), limit: limits.responses },
        surveys: { used: parseInt(surveyCount?.count ?? '0', 10), limit: limits.surveys },
        admins: { used: parseInt(adminCount?.count ?? '0', 10), limit: limits.admins },
        aiDaily: { used: parseInt(aiTodayCount?.count ?? '0', 10), limit: limits.aiDaily },
      },
      plans: PLAN_LIMITS,
      payments,
    })
  } catch (error) {
    console.error('[subscription GET] Failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '取得訂閱資訊失敗' },
      { status: 500 }
    )
  }
}

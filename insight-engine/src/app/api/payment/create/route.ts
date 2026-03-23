import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { queryOne } from '@/lib/db'
import { createPaymentData } from '@/lib/newebpay'
import { PLAN_LIMITS, type PlanKey } from '@/lib/planLimits'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId, userId } = roleCheck

  try {
    const body = await request.json()
    const { plan, period = 'monthly', email } = body as { plan: PlanKey; period?: 'monthly' | 'yearly'; email: string }

    if (!plan || !PLAN_LIMITS[plan]) {
      return NextResponse.json({ error: '無效方案' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: '需要 Email' }, { status: 400 })
    }

    const limits = PLAN_LIMITS[plan]
    if (limits.price === 0) {
      return NextResponse.json({ error: '免費方案無需付款' }, { status: 400 })
    }

    const amount = period === 'yearly'
      ? Math.round(limits.price * 10)
      : limits.price

    const description = `SnowRealm Insight Engine ${limits.name} (${period === 'yearly' ? '年繳' : '月繳'})`

    const paymentData = createPaymentData({
      tenantId,
      plan,
      period,
      amount,
      email,
      description,
    })

    await queryOne(
      `INSERT INTO payment_logs (tenant_id, trade_no, amount, status, provider, raw_response)
       VALUES ($1, $2, $3, 'pending', 'newebpay', $4)
       RETURNING id`,
      [tenantId, paymentData.orderNo, amount, JSON.stringify({ plan, period, userId })]
    )

    return NextResponse.json({
      paymentUrl: paymentData.paymentUrl,
      MerchantID: paymentData.MerchantID,
      TradeInfo: paymentData.TradeInfo,
      TradeSha: paymentData.TradeSha,
      Version: paymentData.Version,
    })
  } catch (error) {
    console.error('[payment/create] Failed:', error)
    return NextResponse.json({ error: '建立付款失敗' }, { status: 500 })
  }
}

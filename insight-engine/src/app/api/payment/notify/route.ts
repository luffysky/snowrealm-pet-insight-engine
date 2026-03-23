import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyAndDecryptNotify } from '@/lib/newebpay'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const tradeInfo = formData.get('TradeInfo') as string
    const tradeSha = formData.get('TradeSha') as string

    if (!tradeInfo || !tradeSha) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const result = verifyAndDecryptNotify(tradeInfo, tradeSha)
    if (!result) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const orderNo = result.Result.MerchantOrderNo
    const isSuccess = result.Status === 'SUCCESS'

    interface PaymentRow extends Record<string, unknown> {
      id: string
      tenant_id: string
      raw_response: Record<string, unknown> | null
    }

    const paymentLog = await queryOne<PaymentRow>(
      `SELECT id, tenant_id, raw_response FROM payment_logs WHERE trade_no = $1`,
      [orderNo]
    )

    if (!paymentLog) {
      console.error('[payment/notify] Unknown order:', orderNo)
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
    }

    const meta = (paymentLog.raw_response || {}) as { plan?: string; period?: string }

    await queryOne(
      `UPDATE payment_logs SET status = $1, raw_response = $2 WHERE trade_no = $3 RETURNING id`,
      [isSuccess ? 'success' : 'failed', JSON.stringify({ ...meta, notify: result }), orderNo]
    )

    if (isSuccess && meta.plan) {
      const plan = meta.plan
      const period = meta.period || 'monthly'
      const now = new Date()
      const periodEnd = new Date(now)
      if (period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      await queryOne(
        `INSERT INTO subscriptions (tenant_id, plan, status, period, current_period_start, current_period_end, newebpay_trade_no, amount, updated_at)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (tenant_id)
         DO UPDATE SET plan = $2, status = 'active', period = $3, current_period_start = $4, current_period_end = $5, newebpay_trade_no = $6, amount = $7, updated_at = NOW()
         RETURNING id`,
        [paymentLog.tenant_id, plan, period, now.toISOString(), periodEnd.toISOString(), result.Result.TradeNo, result.Result.Amt]
      )
    }

    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('[payment/notify] Failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

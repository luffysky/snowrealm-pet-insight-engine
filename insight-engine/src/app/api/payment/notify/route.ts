import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyAndDecryptNotify } from '@/lib/newebpay'
import { upgradePlan } from '@/lib/subscriptionEngine'
import { earnZcoin } from '@/lib/zcoinEngine'

const ZCOIN_PACKAGES: Record<string, number> = {
  zcoin_starter: 30,
  zcoin_basic:   100,
  zcoin_popular: 350,
  zcoin_value:   900,
}

const MERCHANT_ID = process.env.MIG_MERCHANT_ID || process.env.NEWEBPAY_MERCHANT_ID || ''

interface PaymentRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  amount: number
  status: string
  raw_response: Record<string, unknown> | null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const tradeInfo = formData.get('TradeInfo') as string
    const tradeSha = formData.get('TradeSha') as string

    if (!tradeInfo || !tradeSha) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    // 1. 驗證 TradeSha 簽章（在 verifyAndDecryptNotify 內部完成）
    const result = verifyAndDecryptNotify(tradeInfo, tradeSha)
    if (!result) {
      console.error('[payment/notify] TradeSha verification failed')
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    // 2. 驗證 MerchantID 是否為本平台
    if (MERCHANT_ID && result.Result.MerchantID !== MERCHANT_ID) {
      console.error('[payment/notify] MerchantID mismatch:', result.Result.MerchantID)
      return NextResponse.json({ error: 'Invalid merchant' }, { status: 400 })
    }

    const orderNo = result.Result.MerchantOrderNo
    const isSuccess = result.Status === 'SUCCESS'

    const paymentLog = await queryOne<PaymentRow>(
      `SELECT id, tenant_id, amount, status, raw_response FROM payment_logs WHERE trade_no = $1`,
      [orderNo]
    )

    if (!paymentLog) {
      console.error('[payment/notify] Unknown order:', orderNo)
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
    }

    // 3. 冪等性：已處理成功的訂單不重複執行
    if (paymentLog.status === 'success') {
      console.log('[payment/notify] Duplicate notify, already processed:', orderNo)
      return NextResponse.json({ status: 'OK' })
    }

    // 4. 驗證金額是否與預期一致（防止金額竄改）
    if (isSuccess && result.Result.Amt !== paymentLog.amount) {
      console.error(
        `[payment/notify] Amount mismatch: expected ${paymentLog.amount}, got ${result.Result.Amt}`
      )
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    const meta = (paymentLog.raw_response || {}) as { plan?: string; period?: string; zcoin?: number; userId?: string }

    await queryOne(
      `UPDATE payment_logs SET status = $1, raw_response = $2 WHERE trade_no = $3 RETURNING id`,
      [isSuccess ? 'success' : 'failed', JSON.stringify({ ...meta, notify: result }), orderNo]
    )

    if (isSuccess && meta.plan) {
      // Z幣儲值
      if (meta.plan.startsWith('zcoin_') && meta.userId) {
        const zcoinAmount = ZCOIN_PACKAGES[meta.plan] ?? meta.zcoin ?? 0
        if (zcoinAmount > 0) {
          await earnZcoin({
            userId: meta.userId,
            amount: zcoinAmount,
            reason: 'milestone',
            referenceId: orderNo,
          })
        }
      } else {
        // 訂閱方案升級
        await upgradePlan({
          tenantId: paymentLog.tenant_id,
          plan: meta.plan,
          period: meta.period || 'monthly',
          tradeNo: result.Result.TradeNo,
          amount: result.Result.Amt,
        })
      }
    }

    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('[payment/notify] Failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

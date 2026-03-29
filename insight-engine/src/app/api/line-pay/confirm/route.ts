import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID ?? ''
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET ?? ''
const IS_SANDBOX = process.env.LINE_PAY_SANDBOX === 'true'

const LINE_PAY_API = IS_SANDBOX
  ? 'https://sandbox-api-pay.line.me'
  : 'https://api-pay.line.me'

function buildLinePaySignature(
  channelSecret: string,
  requestBody: string,
  nonce: string,
  uri: string
): string {
  const message = channelSecret + uri + requestBody + nonce
  return crypto.createHmac('sha256', channelSecret).update(message).digest('base64')
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const transactionId = searchParams.get('transactionId')
  const orderId = searchParams.get('orderId')

  if (!transactionId || !orderId) {
    return NextResponse.redirect(new URL('/zcoin/topup?error=missing_params', BASE_URL))
  }

  // 查詢訂單（防重複確認）
  const order = await queryOne<{
    id: string
    user_id: string
    plan_id: string
    zcoin_amount: number
    price_ntd: number
    status: string
    is_first_topup: boolean
    bonus_zcoin: number
  }>(
    `SELECT id, user_id, plan_id, zcoin_amount, price_ntd, status, is_first_topup, bonus_zcoin
     FROM payment_orders WHERE order_id = $1`,
    [orderId]
  )

  if (!order) {
    return NextResponse.redirect(new URL('/zcoin/topup?error=order_not_found', BASE_URL))
  }

  // 防重複處理
  if (order.status === 'completed') {
    return NextResponse.redirect(new URL('/zcoin/topup/success?duplicate=1', BASE_URL))
  }
  if (order.status !== 'pending') {
    return NextResponse.redirect(new URL('/zcoin/topup?error=already_processed', BASE_URL))
  }

  // 呼叫 LINE Pay Confirm API
  const uri = `/v3/payments/${transactionId}/confirm`
  const nonce = crypto.randomBytes(8).toString('hex')
  const requestBodyObj = { amount: order.price_ntd, currency: 'TWD' }
  const requestBodyStr = JSON.stringify(requestBodyObj)
  const signature = buildLinePaySignature(CHANNEL_SECRET, requestBodyStr, nonce, uri)

  const confirmRes = await fetch(`${LINE_PAY_API}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    },
    body: requestBodyStr,
  })

  const confirmData = await confirmRes.json()

  if (confirmData.returnCode !== '0000') {
    await execute(
      `UPDATE payment_orders SET status = 'failed', line_pay_response = $1 WHERE order_id = $2`,
      [JSON.stringify(confirmData), orderId]
    )
    return NextResponse.redirect(new URL('/zcoin/topup?error=payment_failed', BASE_URL))
  }

  const totalZcoin = order.zcoin_amount + order.bonus_zcoin

  // 發放 Z 幣（確保 wallet 存在）
  await execute(
    `INSERT INTO zcoin_wallets (user_id, balance, total_earned)
     VALUES ($1, $2, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET balance = zcoin_wallets.balance + $2,
           total_earned = zcoin_wallets.total_earned + $2,
           updated_at = NOW()`,
    [order.user_id, totalZcoin]
  )

  // 記錄交易明細
  const walletRow = await queryOne<{ id: string }>(
    `SELECT id FROM zcoin_wallets WHERE user_id = $1`,
    [order.user_id]
  )
  if (walletRow) {
    await execute(
      `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
       VALUES ($1, $2, 'earn', $3, $4)`,
      [walletRow.id, totalZcoin, `儲值 ${order.zcoin_amount} Z幣${order.bonus_zcoin > 0 ? ` + 首儲加碼 ${order.bonus_zcoin}` : ''}`, orderId]
    )
  }

  // 首儲獎勵：更新 wallet 旗標 + 自動解鎖「招財 VIP」稱號
  if (order.is_first_topup) {
    await execute(
      `UPDATE zcoin_wallets SET has_first_topup = true, first_topup_at = NOW() WHERE user_id = $1`,
      [order.user_id]
    )

    // 自動給予「招財 VIP」稱號（限定商品，免費給首儲者）
    const vipTitle = await queryOne<{ id: string }>(
      `SELECT id FROM zcoin_shop_items WHERE name = '招財 VIP' AND category = 'title' LIMIT 1`
    )
    if (vipTitle) {
      await execute(
        `INSERT INTO zcoin_user_items (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [order.user_id, vipTitle.id]
      )
    }
  }

  // 更新訂單為完成
  await execute(
    `UPDATE payment_orders
     SET status = 'completed', transaction_id = $1, line_pay_response = $2, completed_at = NOW()
     WHERE order_id = $3`,
    [transactionId, JSON.stringify(confirmData), orderId]
  )

  return NextResponse.redirect(
    new URL(`/zcoin/topup/success?zcoin=${totalZcoin}&bonus=${order.bonus_zcoin}`, BASE_URL)
  )
}

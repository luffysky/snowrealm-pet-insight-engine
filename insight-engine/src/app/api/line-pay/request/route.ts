import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { queryOne, execute } from '@/lib/db'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID ?? ''
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET ?? ''
const IS_SANDBOX = process.env.LINE_PAY_SANDBOX === 'true'

const LINE_PAY_API = IS_SANDBOX
  ? 'https://sandbox-api-pay.line.me'
  : 'https://api-pay.line.me'

// 儲值方案
const TOPUP_PLANS: Record<string, { zcoin: number; price: number }> = {
  plan_100:  { zcoin: 100,  price: 30  },
  plan_300:  { zcoin: 300,  price: 79  },
  plan_500:  { zcoin: 500,  price: 119 },
  plan_1000: { zcoin: 1000, price: 199 },
}

function buildLinePaySignature(
  channelSecret: string,
  requestBody: string,
  nonce: string,
  uri: string
): string {
  const message = channelSecret + uri + requestBody + nonce
  return crypto.createHmac('sha256', channelSecret).update(message).digest('base64')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) return NextResponse.json({ error: '請先登入' }, { status: 401 })
  const userId = auth.sub

  const body = await request.json().catch(() => null)
  const planId = body?.planId as string
  const plan = TOPUP_PLANS[planId]

  if (!plan) {
    return NextResponse.json({ error: '無效的儲值方案' }, { status: 400 })
  }

  if (!CHANNEL_ID || !CHANNEL_SECRET) {
    return NextResponse.json(
      { error: 'LINE Pay 尚未設定，請聯繫管理員' },
      { status: 503 }
    )
  }

  // 查詢是否首次儲值
  const wallet = await queryOne<{ has_first_topup: boolean }>(
    `SELECT has_first_topup FROM zcoin_wallets WHERE user_id = $1`,
    [userId]
  )
  const isFirstTopup = !wallet?.has_first_topup
  const bonusZcoin = isFirstTopup ? Math.floor(plan.zcoin * 0.5) : 0 // 首儲加碼 50%

  // 建立訂單
  const orderId = `ZCOIN_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 小時後過期

  await execute(
    `INSERT INTO payment_orders
       (order_id, user_id, plan_id, zcoin_amount, price_ntd, provider, status, is_first_topup, bonus_zcoin, expires_at)
     VALUES ($1,$2,$3,$4,$5,'line_pay','pending',$6,$7,$8)`,
    [orderId, userId, planId, plan.zcoin, plan.price, isFirstTopup, bonusZcoin, expiresAt.toISOString()]
  )

  // 呼叫 LINE Pay Request API
  const uri = '/v3/payments/request'
  const nonce = crypto.randomBytes(8).toString('hex')
  const requestBodyObj = {
    amount: plan.price,
    currency: 'TWD',
    orderId,
    packages: [{
      id: planId,
      amount: plan.price,
      products: [{
        name: `SnowRealm Z幣 ${plan.zcoin}✦${isFirstTopup ? ' + 首儲加碼 50%' : ''}`,
        imageUrl: `${BASE_URL}/images/zcoin-icon.png`,
        quantity: 1,
        price: plan.price,
      }],
    }],
    redirectUrls: {
      confirmUrl: `${BASE_URL}/api/line-pay/confirm`,
      cancelUrl: `${BASE_URL}/zcoin/topup?cancelled=1`,
    },
  }
  const requestBodyStr = JSON.stringify(requestBodyObj)
  const signature = buildLinePaySignature(CHANNEL_SECRET, requestBodyStr, nonce, uri)

  const linePayRes = await fetch(`${LINE_PAY_API}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    },
    body: requestBodyStr,
  })

  const linePayData = await linePayRes.json()

  if (linePayData.returnCode !== '0000') {
    // 更新訂單狀態為 failed
    await execute(`UPDATE payment_orders SET status = 'failed' WHERE order_id = $1`, [orderId])
    return NextResponse.json(
      { error: `LINE Pay 請求失敗：${linePayData.returnMessage}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    orderId,
    paymentUrl: linePayData.info.paymentUrl.web,
    appUrl: linePayData.info.paymentUrl.app,
    plan: { ...plan, bonusZcoin, totalZcoin: plan.zcoin + bonusZcoin },
  })
}

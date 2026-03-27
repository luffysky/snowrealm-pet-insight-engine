import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { queryOne } from '@/lib/db'
import { createPaymentData } from '@/lib/newebpay'

const PACKAGES: Record<string, { zcoin: number; ntd: number }> = {
  starter: { zcoin: 150,  ntd: 30  },
  basic:   { zcoin: 500,  ntd: 90  },
  popular: { zcoin: 1750, ntd: 290 },
  value:   { zcoin: 4500, ntd: 690 },
}

/** GET /api/payment/zcoin-recharge?amount=100&package=basic&email=xxx */
export async function GET(request: NextRequest) {
  // 直接讀 cookie 驗證（此路由不在 /api/admin/* 下，middleware 不會注入 headers）
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/zcoin-shop')
    return NextResponse.redirect(loginUrl)
  }
  const userId = auth.sub
  const tenantId = auth.tenants?.[0]?.tid ?? auth.tid ?? 'default'

  const { searchParams } = new URL(request.url)
  const packageId = searchParams.get('package') ?? ''
  const emailParam = searchParams.get('email') ?? ''

  const pkg = PACKAGES[packageId]
  if (!pkg) {
    return NextResponse.json({ error: '無效的儲值方案' }, { status: 400 })
  }

  // 從 DB 取 email（fallback 用 query param）
  const userRow = await queryOne<{ username: string }>(
    `SELECT username FROM admin_users WHERE id = $1`,
    [userId]
  )
  const email = emailParam || userRow?.username || 'user@snowrealm.pet'

  const paymentData = createPaymentData({
    tenantId,
    plan: `zcoin_${packageId}`,
    period: 'monthly',
    amount: pkg.ntd,
    email,
    description: `Z幣儲值 ${pkg.zcoin} 枚（NT$${pkg.ntd}）`,
  })

  // 記錄 pending payment
  await queryOne(
    `INSERT INTO payment_logs (tenant_id, trade_no, amount, status, provider, raw_response)
     VALUES ($1, $2, $3, 'pending', 'newebpay', $4)
     RETURNING id`,
    [
      tenantId,
      paymentData.orderNo,
      pkg.ntd,
      JSON.stringify({ zcoin: pkg.zcoin, packageId, userId }),
    ]
  )

  // 組成藍新 POST 表單並自動提交
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>前往付款...</title></head>
<body>
<form id="f" method="POST" action="${paymentData.paymentUrl}">
  <input type="hidden" name="MerchantID" value="${paymentData.MerchantID}">
  <input type="hidden" name="TradeInfo" value="${paymentData.TradeInfo}">
  <input type="hidden" name="TradeSha" value="${paymentData.TradeSha}">
  <input type="hidden" name="Version" value="${paymentData.Version}">
</form>
<script>document.getElementById('f').submit();</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

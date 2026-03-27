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

function errorHtml(title: string, message: string, backUrl = '/zcoin-shop'): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:2rem;max-width:400px}h2{color:#fbbf24;margin-bottom:1rem}p{color:rgba(255,255,255,.6);margin-bottom:2rem}
a{background:#f59e0b;color:#1e293b;padding:.6rem 1.5rem;border-radius:.5rem;text-decoration:none;font-weight:600}</style>
</head>
<body><div class="box"><h2>⚠️ ${title}</h2><p>${message}</p><a href="${backUrl}">← 返回</a></div></body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** GET /api/payment/zcoin-recharge?package=basic */
export async function GET(request: NextRequest) {
  // 直接讀 cookie 驗證（此路由不在 /api/admin/* 下，middleware 不會注入 headers）
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/zcoin-shop')
    return NextResponse.redirect(loginUrl)
  }

  const { searchParams } = new URL(request.url)
  const packageId = searchParams.get('package') ?? ''
  const pkg = PACKAGES[packageId]
  if (!pkg) {
    return errorHtml('無效的儲值方案', '請返回重新選擇方案。')
  }

  // 檢查藍新設定是否已配置
  const hasNewebpay =
    !!(process.env.MIG_MERCHANT_ID || process.env.NEWEBPAY_MERCHANT_ID) &&
    !!(process.env.MIG_HASH_KEY || process.env.NEWEBPAY_HASH_KEY) &&
    !!(process.env.MIG_HASH_IV || process.env.NEWEBPAY_HASH_IV)

  if (!hasNewebpay) {
    return errorHtml(
      '付款功能尚未開通',
      '線上付款功能正在建置中，請稍後再試，或聯繫客服。'
    )
  }

  try {
    const userId = auth.sub
    const tenantId = auth.tenants?.[0]?.tid ?? auth.tid ?? 'default'

    const userRow = await queryOne<{ username: string }>(
      `SELECT username FROM admin_users WHERE id = $1`,
      [userId]
    )
    const email = userRow?.username || 'user@snowrealm.pet'

    const paymentData = createPaymentData({
      tenantId,
      plan: `zcoin_${packageId}`,
      period: 'monthly',
      amount: pkg.ntd,
      email,
      description: `Z幣儲值 ${pkg.zcoin} 枚（NT$${pkg.ntd}）`,
    })

    // 記錄 pending payment（plan 欄位供 notify webhook 識別付款類型）
    await queryOne(
      `INSERT INTO payment_logs (tenant_id, trade_no, amount, status, provider, raw_response)
       VALUES ($1, $2, $3, 'pending', 'newebpay', $4)
       RETURNING id`,
      [
        tenantId,
        paymentData.orderNo,
        pkg.ntd,
        JSON.stringify({ plan: `zcoin_${packageId}`, zcoin: pkg.zcoin, packageId, userId }),
      ]
    )

    // 組成藍新 POST 表單並自動提交
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>前往付款...</title>
<style>body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}</style>
</head>
<body>
<p>正在前往付款頁面，請稍候...</p>
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
  } catch (err) {
    console.error('[zcoin-recharge] Error:', err)
    return errorHtml('付款處理失敗', '系統發生錯誤，請稍後再試。如問題持續，請聯繫客服。')
  }
}

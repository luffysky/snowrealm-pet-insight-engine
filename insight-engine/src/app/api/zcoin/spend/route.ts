import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { spendZcoin, getBalance } from '@/lib/zcoinEngine'

/** POST /api/zcoin/spend — 花費 Z幣 */
export async function POST(req: Request) {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  let body: { amount: number; reason: string }
  try {
    body = await req.json() as { amount: number; reason: string }
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })
  }

  const { amount, reason } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: '請提供有效的花費金額' }, { status: 400 })
  }
  if (!reason || typeof reason !== 'string') {
    return NextResponse.json({ error: '請提供花費原因' }, { status: 400 })
  }

  const params = { userId: ctx.userId, tenantId: ctx.tenantId }

  try {
    const result = await spendZcoin({
      ...params,
      amount,
      reason: reason as never,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Z幣不足' }, { status: 400 })
    }

    const newBalance = await getBalance(params)
    return NextResponse.json({ success: true, newBalance })
  } catch (err) {
    console.error('[POST /api/zcoin/spend] Error:', err)
    return NextResponse.json({ error: '花費 Z幣失敗，請稍後再試' }, { status: 500 })
  }
}

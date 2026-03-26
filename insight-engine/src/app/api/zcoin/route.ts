import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getBalance, getTransactionHistory, earnZcoin, spendZcoin } from '@/lib/zcoinEngine'

/** GET /api/zcoin — 取得當前餘額與交易歷史 */
export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const params = { userId: ctx.userId, tenantId: ctx.tenantId }
  const [balance, history] = await Promise.all([
    getBalance(params),
    getTransactionHistory({ ...params, limit: 30 }),
  ])

  return NextResponse.json({ balance, history })
}

/** POST /api/zcoin — 發起交易（earn 或 spend） */
export async function POST(req: Request) {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const body = await req.json() as {
    action: 'earn' | 'spend'
    amount: number
    reason: string
    referenceId?: string
  }

  const params = { userId: ctx.userId, tenantId: ctx.tenantId }

  if (body.action === 'earn') {
    const result = await earnZcoin({ ...params, amount: body.amount, reason: body.reason as never, referenceId: body.referenceId })
    return NextResponse.json(result)
  }

  if (body.action === 'spend') {
    const result = await spendZcoin({ ...params, amount: body.amount, reason: body.reason as never, referenceId: body.referenceId })
    if (!result.ok) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: '無效的 action' }, { status: 400 })
}

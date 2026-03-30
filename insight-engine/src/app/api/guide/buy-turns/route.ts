import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { spendZcoin } from '@/lib/zcoinEngine'
import { queryOne, execute } from '@/lib/db'

export const runtime = 'nodejs'

const TURN_PACKS = {
  s: { zcoins: 5,  turns: 20,  label: '20 次對話' },
  m: { zcoins: 10, turns: 50,  label: '50 次對話' },
  l: { zcoins: 20, turns: 120, label: '120 次對話' },
} as const

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  if (!token) {
    return NextResponse.json({ error: '請先登入才能購買對話次數' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: '登入已過期，請重新登入' }, { status: 401 })
  }

  const userId = payload.sub
  const { pack } = await req.json() as { pack: 's' | 'm' | 'l' }

  const packDef = TURN_PACKS[pack]
  if (!packDef) {
    return NextResponse.json({ error: '無效的方案' }, { status: 400 })
  }

  // 扣 Z幣
  const result = await spendZcoin({
    userId,
    amount: packDef.zcoins,
    reason: `雪凜對話次數：${packDef.label}`,
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Z幣不足', balance: result.balance }, { status: 402 })
  }

  // 加對話次數（持久）
  const userKey = `user:${userId}`
  await execute(
    `INSERT INTO guide_chat_credits (user_key, credits, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_key) DO UPDATE
       SET credits = guide_chat_credits.credits + $2,
           updated_at = NOW()`,
    [userKey, packDef.turns]
  )

  const creditRow = await queryOne<{ credits: number }>(
    `SELECT credits FROM guide_chat_credits WHERE user_key = $1`,
    [userKey]
  )

  return NextResponse.json({
    ok: true,
    addedTurns: packDef.turns,
    totalCredits: creditRow?.credits ?? packDef.turns,
    newZcoinBalance: result.balance,
  })
}

export { TURN_PACKS }

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { userId } = await params
  try {
    const [txRows, wallet] = await Promise.all([
      query<{ id: string; type: string; amount: number; reason: string | null; created_at: string }>(
        `SELECT id, type, amount, reason, created_at FROM zcoin_transactions WHERE wallet_id IN (SELECT id FROM zcoin_wallets WHERE user_id = $1) ORDER BY created_at DESC LIMIT 100`,
        [userId]
      ),
      queryOne<{ balance: number; total_earned: number }>(
        `SELECT balance, total_earned FROM zcoin_wallets WHERE user_id = $1`,
        [userId]
      ),
    ])
    return NextResponse.json({ transactions: txRows, wallet })
  } catch {
    return NextResponse.json({ transactions: [], wallet: null })
  }
}

/** POST — 超級管理員手動發放 Z幣給特定用戶 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { userId } = await params
  const body = await request.json() as { amount: number; reason?: string }

  if (!body.amount || typeof body.amount !== 'number' || body.amount === 0) {
    return NextResponse.json({ error: '請指定有效的金額（正數發放，負數扣除）' }, { status: 400 })
  }

  try {
    // 取得或建立錢包
    let wallet = await queryOne<{ id: string; balance: number }>(
      `SELECT id, balance FROM zcoin_wallets WHERE user_id = $1`,
      [userId]
    )

    if (!wallet) {
      wallet = await queryOne<{ id: string; balance: number }>(
        `INSERT INTO zcoin_wallets (user_id, balance, total_earned)
         VALUES ($1, 0, 0) RETURNING id, balance`,
        [userId]
      )
    }

    if (!wallet) return NextResponse.json({ error: '錢包建立失敗' }, { status: 500 })

    const amount = body.amount
    const isEarn = amount > 0
    const reason = body.reason ?? (isEarn ? 'admin_grant' : 'admin_deduct')

    // 更新餘額
    await execute(
      `UPDATE zcoin_wallets
       SET balance = balance + $1,
           ${isEarn ? 'total_earned = total_earned + $1,' : ''}
           updated_at = NOW()
       WHERE id = $2`,
      isEarn ? [amount, wallet.id] : [amount, wallet.id]
    )

    // 記錄交易
    await execute(
      `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [wallet.id, amount, isEarn ? 'earn' : 'spend', reason, `admin:${admin.sub}`]
    )

    const newBalance = wallet.balance + amount
    return NextResponse.json({ ok: true, newBalance, amount })
  } catch (err) {
    console.error('[super-admin zcoin POST]', err)
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

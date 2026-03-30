import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

/**
 * POST /api/super-admin/zcoin
 * 批量發放 Z幣給所有用戶（或指定條件的用戶）
 * body: { amount, reason?, targetAll?: boolean, targetUserIds?: string[] }
 */
export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await request.json() as {
    amount: number
    reason?: string
    targetAll?: boolean
    targetUserIds?: string[]
  }

  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return NextResponse.json({ error: '請指定正整數金額' }, { status: 400 })
  }

  const amount = Math.floor(body.amount)
  const reason = body.reason ?? 'admin_bulk_grant'

  try {
    let affectedCount = 0

    if (body.targetUserIds?.length) {
      // 指定用戶
      for (const uid of body.targetUserIds) {
        await grantToUser(uid, amount, reason, admin.sub)
        affectedCount++
      }
    } else if (body.targetAll) {
      // 所有活躍用戶（未刪除）
      const users = await query<{ id: string }>(
        `SELECT id FROM admin_users WHERE deleted_at IS NULL ORDER BY created_at`
      )
      for (const u of users) {
        await grantToUser(u.id, amount, reason, admin.sub)
        affectedCount++
      }
    } else {
      return NextResponse.json({ error: '請指定 targetAll=true 或 targetUserIds' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, affectedCount, amount })
  } catch (err) {
    console.error('[super-admin zcoin bulk POST]', err)
    return NextResponse.json({ error: '批量操作失敗' }, { status: 500 })
  }
}

async function grantToUser(userId: string, amount: number, reason: string, adminId: string) {
  // Upsert wallet
  await execute(
    `INSERT INTO zcoin_wallets (user_id, balance, total_earned)
     VALUES ($1, $2, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET balance = zcoin_wallets.balance + $2,
           total_earned = zcoin_wallets.total_earned + $2,
           updated_at = NOW()`,
    [userId, amount]
  )

  const wallet = await query<{ id: string }>(
    `SELECT id FROM zcoin_wallets WHERE user_id = $1`,
    [userId]
  )
  if (!wallet[0]) return

  await execute(
    `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
     VALUES ($1, $2, 'earn', $3, $4)`,
    [wallet[0].id, amount, reason, `admin:${adminId}`]
  )
}

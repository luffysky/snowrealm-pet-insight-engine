import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

/*
  DB Migration (run once):
  ALTER TABLE zcoin_transactions ADD COLUMN IF NOT EXISTS note TEXT;

  CREATE TABLE IF NOT EXISTS zcoin_grant_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    amount INT NOT NULL,
    reason TEXT,
    note TEXT,
    affected_count INT NOT NULL DEFAULT 0,
    target_user_ids TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
*/

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

/** GET /api/super-admin/zcoin — 取得發放記錄 */
export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const logs = await query<Record<string, unknown>>(
      `SELECT gl.*, au.display_name AS admin_name
       FROM zcoin_grant_logs gl
       LEFT JOIN admin_users au ON au.id::text = gl.admin_id
       ORDER BY gl.created_at DESC
       LIMIT 50`
    )
    return NextResponse.json({ logs })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ logs: [] })
    console.error('[super-admin zcoin GET]', err)
    return NextResponse.json({ logs: [] })
  }
}

/**
 * POST /api/super-admin/zcoin
 * 批量發放 Z幣給所有用戶（或指定條件的用戶）
 * body: { amount, reason?, note?, targetAll?: boolean, targetUserIds?: string[] }
 *   reason: 內部記錄用（管理員看）
 *   note: 顯示給使用者看的說明
 */
export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await request.json() as {
    amount: number
    reason?: string
    note?: string
    targetAll?: boolean
    targetUserIds?: string[]
  }

  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return NextResponse.json({ error: '請指定正整數金額' }, { status: 400 })
  }

  const amount = Math.floor(body.amount)
  const reason = body.reason ?? 'admin_bulk_grant'
  const note = body.note?.trim() ?? null

  try {
    let affectedCount = 0
    const targetUserIds: string[] = []

    if (body.targetUserIds?.length) {
      // 指定用戶
      for (const uid of body.targetUserIds) {
        await grantToUser(uid, amount, reason, note, admin.sub)
        affectedCount++
        targetUserIds.push(uid)
      }
    } else if (body.targetAll) {
      // 所有活躍用戶（未刪除）
      const users = await query<{ id: string }>(
        `SELECT id FROM admin_users WHERE deleted_at IS NULL ORDER BY created_at`
      )
      for (const u of users) {
        await grantToUser(u.id, amount, reason, note, admin.sub)
        affectedCount++
      }
    } else {
      return NextResponse.json({ error: '請指定 targetAll=true 或 targetUserIds' }, { status: 400 })
    }

    // 記錄發放日誌到 DB
    await execute(
      `INSERT INTO zcoin_grant_logs (admin_id, target_type, amount, reason, note, affected_count, target_user_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        admin.sub,
        body.targetAll ? 'all' : 'specific',
        amount,
        reason,
        note,
        affectedCount,
        targetUserIds.length > 0 ? targetUserIds : null,
      ]
    ).catch(e => {
      // If table doesn't exist yet, log but don't fail
      if ((e as { code?: string })?.code !== '42P01') console.error('[zcoin grant log]', e)
    })

    return NextResponse.json({ ok: true, affectedCount, amount })
  } catch (err) {
    console.error('[super-admin zcoin bulk POST]', err)
    return NextResponse.json({ error: '批量操作失敗' }, { status: 500 })
  }
}

async function grantToUser(userId: string, amount: number, reason: string, note: string | null, adminId: string) {
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

  const wallet = await queryOne<{ id: string }>(
    `SELECT id FROM zcoin_wallets WHERE user_id = $1`,
    [userId]
  )
  if (!wallet) return

  // note column stores the user-visible message; reason is internal
  await execute(
    `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id, note)
     VALUES ($1, $2, 'earn', $3, $4, $5)`,
    [wallet.id, amount, reason, `admin:${adminId}`, note]
  ).catch(async () => {
    // Fallback: if note column doesn't exist yet
    await execute(
      `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
       VALUES ($1, $2, 'earn', $3, $4)`,
      [wallet.id, amount, reason, `admin:${adminId}`]
    )
  })
}

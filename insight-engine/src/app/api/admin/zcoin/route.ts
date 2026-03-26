import { NextResponse } from 'next/server'
import { requireRole, type TenantContext } from '@/lib/tenant'
import { query } from '@/lib/db'

interface WalletRow extends Record<string, unknown> {
  id: string
  user_id: string | null
  line_user_id: string | null
  username: string | null
  balance: number
  total_earned: number
  total_spent: number
  created_at: string
}

/** GET /api/admin/zcoin — Z幣管理統計（管理員用） */
export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { tenantId } = roleCheck as TenantContext

  const wallets = await query<WalletRow>(
    `SELECT w.id, w.user_id, w.line_user_id, au.username,
            w.balance, w.total_earned, w.total_spent, w.created_at
     FROM zcoin_wallets w
     LEFT JOIN admin_users au ON au.id = w.user_id
     WHERE w.tenant_id = $1
     ORDER BY w.balance DESC
     LIMIT 200`,
    [tenantId]
  )

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0)
  const totalEarned = wallets.reduce((s, w) => s + w.total_earned, 0)
  const totalSpent = wallets.reduce((s, w) => s + w.total_spent, 0)

  return NextResponse.json({
    totalWallets: wallets.length,
    totalBalance,
    totalEarned,
    totalSpent,
    wallets,
  })
}

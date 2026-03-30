import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { userId }
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const accounts = await query<{
      user_id: string; nickname: string; display_name: string
      risk_score: number; watchlist: boolean; created_at: string
      username: string; role: string
    }>(
      `SELECT up.user_id, up.nickname, up.display_name, up.risk_score, up.watchlist, up.created_at,
              au.username, au.role
       FROM user_profiles up
       LEFT JOIN admin_users au ON au.id = up.user_id
       WHERE up.risk_score > 50
       ORDER BY up.risk_score DESC
       LIMIT 50`
    )
    return NextResponse.json({ accounts })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ accounts: [] })
    throw err
  }
}

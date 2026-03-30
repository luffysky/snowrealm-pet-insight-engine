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
    const bans = await query<{
      id: string; user_id: string; details: string; created_at: string
      nickname: string; display_name: string
    }>(
      `SELECT al.id, al.user_id, al.details, al.created_at,
              up.nickname, up.display_name
       FROM activity_log al
       LEFT JOIN user_profiles up ON up.user_id = al.user_id
       WHERE al.action = 'system.auto_ban'
         AND al.created_at >= CURRENT_DATE
       ORDER BY al.created_at DESC
       LIMIT 50`
    )
    return NextResponse.json({ bans })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ bans: [] })
    throw err
  }
}

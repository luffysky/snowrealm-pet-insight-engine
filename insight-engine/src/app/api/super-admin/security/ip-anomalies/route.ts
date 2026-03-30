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
    const anomalies = await query<{
      ip_address: string; count: string; last_seen: string; user_ids: string[]
    }>(
      `SELECT ip_address::text, COUNT(*)::text AS count,
              MAX(created_at) AS last_seen,
              array_agg(DISTINCT user_id) AS user_ids
       FROM activity_log
       WHERE action = 'auth.register'
         AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY ip_address
       HAVING COUNT(*) > 3
       ORDER BY count DESC
       LIMIT 50`
    )
    return NextResponse.json({
      anomalies: anomalies.map(a => ({ ...a, count: Number(a.count) })),
    })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ anomalies: [] })
    throw err
  }
}

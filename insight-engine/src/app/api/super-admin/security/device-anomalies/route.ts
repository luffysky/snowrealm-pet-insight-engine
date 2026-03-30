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
      fingerprint: string; user_count: string; user_ids: string[]
    }>(
      `SELECT fingerprint, COUNT(DISTINCT user_id)::text AS user_count,
              array_agg(DISTINCT user_id) AS user_ids
       FROM device_fingerprints
       GROUP BY fingerprint
       HAVING COUNT(DISTINCT user_id) > 1
       ORDER BY user_count DESC
       LIMIT 50`
    )
    return NextResponse.json({
      anomalies: anomalies.map(a => ({ ...a, user_count: Number(a.user_count) })),
    })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ anomalies: [] })
    throw err
  }
}

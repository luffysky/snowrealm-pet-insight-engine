import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { userId }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)

  try {
    const entries = await query<{
      id: string; user_id: string; action: string; category: string
      details: string; ip_address: string; created_at: string
      nickname: string; display_name: string
    }>(
      `SELECT al.id, al.user_id, al.action, al.category, al.details, al.ip_address, al.created_at,
              up.nickname, up.display_name
       FROM activity_log al
       LEFT JOIN user_profiles up ON up.user_id = al.user_id
       WHERE ($1 = 'all' OR al.category = $1)
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [category, limit]
    )
    return NextResponse.json({ entries })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ entries: [] })
    throw err
  }
}

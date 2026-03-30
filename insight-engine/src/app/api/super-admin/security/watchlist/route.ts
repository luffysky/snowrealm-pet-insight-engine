import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
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
    const entries = await query<{
      id: string; user_id: string; reason: string; risk_signals: unknown
      added_by: string; created_at: string; nickname: string; display_name: string
    }>(
      `SELECT w.id, w.user_id, w.reason, w.risk_signals, w.added_by, w.created_at,
              up.nickname, up.display_name
       FROM watchlist w
       LEFT JOIN user_profiles up ON up.user_id = w.user_id
       WHERE w.resolved = false
       ORDER BY w.created_at DESC`
    )
    return NextResponse.json({ entries })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ entries: [] })
    throw err
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as { id?: string; action?: 'resolve' | 'ban' }
  if (!body.id || !body.action) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })

  try {
    if (body.action === 'resolve') {
      await execute(`UPDATE watchlist SET resolved = true WHERE id = $1`, [body.id])
    } else if (body.action === 'ban') {
      const entry = await query<{ user_id: string }>(`SELECT user_id FROM watchlist WHERE id = $1`, [body.id])
      if (entry[0]?.user_id) {
        await execute(`UPDATE admin_users SET is_banned = true, banned_by = $1, banned_at = NOW() WHERE id = $2`, [auth.userId, entry[0].user_id])
      }
      await execute(`UPDATE watchlist SET resolved = true WHERE id = $1`, [body.id])
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ ok: true })
    throw err
  }
}

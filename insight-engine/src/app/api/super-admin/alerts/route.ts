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
    const alerts = await query<{
      id: string; level: string; title: string; details: string; created_at: string
    }>(
      `SELECT id, level, title, details, created_at
       FROM system_alerts
       WHERE acknowledged = false
       ORDER BY created_at DESC
       LIMIT 20`
    )
    return NextResponse.json({ alerts })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ alerts: [] })
    throw err
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as { id?: string }
  if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  try {
    await execute(
      `UPDATE system_alerts SET acknowledged = true, acknowledged_by = $1 WHERE id = $2`,
      [auth.userId, body.id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P01') return NextResponse.json({ ok: true })
    throw err
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
  const status = searchParams.get('status') ?? 'all'
  const method = searchParams.get('method') ?? 'all'
  const offset = (page - 1) * pageSize

  try {
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::TEXT AS total FROM payment_orders
       WHERE ($1 = 'all' OR status = $1) AND ($2 = 'all' OR payment_method = $2)`,
      [status, method]
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query(
      `SELECT id, user_id, amount, zcoin_amount, payment_method, status,
              merchant_order_no, created_at, completed_at
       FROM payment_orders
       WHERE ($1 = 'all' OR status = $1)
         AND ($2 = 'all' OR payment_method = $2)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [status, method, pageSize, offset]
    )

    return NextResponse.json({ rows, total })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ rows: [], total: 0 })
    console.error('[orders GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

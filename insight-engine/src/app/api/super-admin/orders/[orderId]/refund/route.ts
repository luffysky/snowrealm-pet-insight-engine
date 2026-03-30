import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { orderId } = await params
  const { reason } = await request.json() as { reason: string }
  if (!reason) return NextResponse.json({ error: '缺少退款原因' }, { status: 400 })

  try {
    const order = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM payment_orders WHERE id = $1`,
      [orderId]
    )
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 })
    if (order.status !== 'completed') {
      return NextResponse.json({ error: '只能退款已完成的訂單' }, { status: 400 })
    }

    await execute(
      `UPDATE payment_orders SET status = 'refunded', refund_reason = $1, refunded_at = NOW()
       WHERE id = $2 AND status = 'completed'`,
      [reason, orderId]
    )

    try {
      await execute(
        `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(auth.sub ?? ''),
          String(auth.name ?? ''),
          'order.refund',
          'payment_orders',
          orderId,
          JSON.stringify({ reason }),
        ]
      )
    } catch {
      // non-fatal
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ error: '訂單資料表不存在' }, { status: 404 })
    console.error('[orders/refund POST]', err)
    return NextResponse.json({ error: '退款操作失敗' }, { status: 500 })
  }
}

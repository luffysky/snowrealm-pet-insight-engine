import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

interface OrderRow extends Record<string, unknown> {
  id: string
  user_id: string | null
  amount: number
  zcoin_amount: number | null
  payment_method: string
  status: string
  merchant_order_no: string | null
  created_at: string
  completed_at: string | null
}

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

function toCsvRow(row: OrderRow): string {
  const fields = [
    row.merchant_order_no ?? row.id,
    row.user_id ?? '',
    row.amount,
    row.zcoin_amount ?? '',
    row.payment_method,
    row.status,
    row.created_at,
    row.completed_at ?? '',
  ]
  return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')
}

/**
 * GET /api/super-admin/orders/export
 * 匯出所有訂單為 CSV（super_admin 限定）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const rows = await query<OrderRow>(
      `SELECT id, user_id, amount, zcoin_amount, payment_method, status,
              merchant_order_no, created_at, completed_at
       FROM payment_orders
       ORDER BY created_at DESC
       LIMIT 10000`,
      []
    )

    const header = '訂單號,使用者ID,金額,Z幣,付款方式,狀態,建立時間,完成時間'
    const csvLines = [header, ...rows.map(toCsvRow)]
    const csvContent = csvLines.join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return new NextResponse('訂單號,使用者ID,金額,Z幣,付款方式,狀態,建立時間,完成時間\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="orders.csv"',
        },
      })
    }
    console.error('[orders/export GET]', err)
    return NextResponse.json({ error: '匯出失敗' }, { status: 500 })
  }
}

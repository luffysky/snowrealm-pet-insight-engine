import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })
  const { userId } = await params
  try {
    const orders = await query(
      `SELECT id, amount, zcoin_amount, payment_method, status, created_at FROM payment_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    )
    return NextResponse.json({ orders })
  } catch { return NextResponse.json({ orders: [] }) }
}

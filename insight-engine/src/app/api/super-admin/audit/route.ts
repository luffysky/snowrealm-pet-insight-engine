import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ tid: payload.tid, role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

interface AuditRow extends Record<string, unknown> {
  id: string
  actor_id: string
  actor_name: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)))
    const offset = (page - 1) * pageSize
    const action = searchParams.get('action')
    const actorId = searchParams.get('actorId')

    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (action) {
      conditions.push(`action = $${idx++}`)
      params.push(action)
    }
    if (actorId) {
      conditions.push(`actor_id = $${idx++}`)
      params.push(actorId)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: string } & Record<string, unknown>>(
      `SELECT COUNT(*)::TEXT AS total FROM audit_logs ${where}`,
      params
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query<AuditRow>(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, pageSize, offset]
    )

    return NextResponse.json({ data: rows, total })
  } catch (error) {
    console.error('[super-admin/audit GET] Failed:', error)
    return NextResponse.json({ error: '取得審計紀錄失敗' }, { status: 500 })
  }
}

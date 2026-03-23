import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants =
    payload.tenants || (payload.tid ? [{ tid: payload.tid, role: payload.role || 'admin' }] : [])
  const isSuper =
    tenants.some(t => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

interface TicketRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  channel: string
  email: string | null
  status: string
  priority: string
  category: string | null
  subject: string | null
  created_at: string
  updated_at: string
  last_message: string | null
  last_message_at: string | null
  message_count: number
  tenant_name: string | null
}

interface StatsRow extends Record<string, unknown> {
  status: string
  count: string
}

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifySuperAdmin(request)
    if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const tenantFilter = searchParams.get('tenant')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '30', 10)))
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(`t.status = $${idx++}`)
      params.push(status)
    }
    if (tenantFilter) {
      conditions.push(`t.tenant_id = $${idx++}`)
      params.push(tenantFilter)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: string } & Record<string, unknown>>(
      `SELECT COUNT(*)::TEXT AS total FROM support_tickets t ${where}`,
      params
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const tickets = await query<TicketRow>(
      `SELECT t.*,
              tn.name AS tenant_name,
              lm.content AS last_message,
              lm.created_at AS last_message_at,
              COALESCE(mc.cnt, 0)::INT AS message_count
       FROM support_tickets t
       LEFT JOIN tenants tn ON tn.slug = t.tenant_id
       LEFT JOIN LATERAL (
         SELECT content, created_at
         FROM support_messages
         WHERE ticket_id = t.id
         ORDER BY created_at DESC
         LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::INT AS cnt
         FROM support_messages
         WHERE ticket_id = t.id
       ) mc ON true
       ${where}
       ORDER BY
         CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
         t.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, pageSize, offset]
    )

    const statsRows = await query<StatsRow>(
      `SELECT status, COUNT(*)::TEXT AS count FROM support_tickets GROUP BY status`
    )
    const statsMap: Record<string, number> = {}
    for (const r of statsRows) statsMap[r.status] = parseInt(r.count, 10)

    return NextResponse.json({
      data: tickets,
      total,
      stats: {
        open: statsMap['open'] ?? 0,
        inProgress: statsMap['in_progress'] ?? 0,
        resolved: statsMap['resolved'] ?? 0,
        closed: statsMap['closed'] ?? 0,
      },
    })
  } catch (error) {
    console.error('[super-admin/support GET] Failed:', error)
    return NextResponse.json({ error: '取得全平台工單失敗' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifySuperAdmin(request)
    if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

    const body = await request.json()
    const { ticketId, status, priority } = body

    if (!ticketId) return NextResponse.json({ error: '缺少 ticketId' }, { status: 400 })

    const sets: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (status && VALID_STATUSES.includes(status)) {
      sets.push(`status = $${idx++}`)
      params.push(status)
      if (status === 'resolved') {
        sets.push(`resolved_at = NOW()`)
      } else if (status === 'open') {
        sets.push(`resolved_at = NULL`)
      }
    }
    if (priority) {
      sets.push(`priority = $${idx++}`)
      params.push(priority)
    }

    if (sets.length === 0) return NextResponse.json({ error: '無更新欄位' }, { status: 400 })

    sets.push('updated_at = NOW()')
    params.push(ticketId)

    const updated = await queryOne(
      `UPDATE support_tickets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`,
      params
    )

    if (!updated) return NextResponse.json({ error: '找不到工單' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[super-admin/support PATCH] Failed:', error)
    return NextResponse.json({ error: '更新工單失敗' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

interface TicketRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  channel: string
  line_user_id: string | null
  line_display_name: string | null
  email: string | null
  status: string
  priority: string
  category: string | null
  subject: string | null
  assigned_to: string | null
  survey_id: string | null
  response_id: string | null
  first_response_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  last_message: string | null
  last_message_at: string | null
  message_count: number
}

interface StatsRow extends Record<string, unknown> {
  status: string
  count: string
}

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed']
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent']

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
    const offset = (page - 1) * pageSize

    const conditions = ['t.tenant_id = $1']
    const params: unknown[] = [tenantId]
    let idx = 2

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(`t.status = $${idx++}`)
      params.push(status)
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      conditions.push(`t.priority = $${idx++}`)
      params.push(priority)
    }
    if (category) {
      conditions.push(`t.category = $${idx++}`)
      params.push(category)
    }

    const where = conditions.join(' AND ')

    const countRow = await queryOne<{ total: string } & Record<string, unknown>>(
      `SELECT COUNT(*)::TEXT AS total FROM support_tickets t WHERE ${where}`,
      params
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const tickets = await query<TicketRow>(
      `SELECT t.*,
              lm.content AS last_message,
              lm.created_at AS last_message_at,
              COALESCE(mc.cnt, 0)::INT AS message_count
       FROM support_tickets t
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
       WHERE ${where}
       ORDER BY
         CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
         t.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, pageSize, offset]
    )

    const statsRows = await query<StatsRow>(
      `SELECT status, COUNT(*)::TEXT AS count
       FROM support_tickets
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenantId]
    )

    const statsMap: Record<string, number> = {}
    for (const r of statsRows) {
      statsMap[r.status] = parseInt(r.count, 10)
    }

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
    console.error('[admin/support GET] Failed:', error)
    return NextResponse.json({ error: '取得工單列表失敗' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  try {
    const { tenantId, userId, userName } = roleCheck
    const body = await request.json()
    const { subject, category, priority, channel, email, content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '缺少訊息內容' }, { status: 400 })
    }

    const ticketPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'normal'
    const ticketChannel = channel ?? 'web'

    const ticket = await queryOne<TicketRow>(
      `INSERT INTO support_tickets
         (tenant_id, channel, email, status, priority, category, subject)
       VALUES ($1, $2, $3, 'open', $4, $5, $6)
       RETURNING *`,
      [tenantId, ticketChannel, email ?? null, ticketPriority, category ?? null, subject ?? content.slice(0, 50)]
    )

    if (!ticket) {
      return NextResponse.json({ error: '建立工單失敗' }, { status: 500 })
    }

    await queryOne(
      `INSERT INTO support_messages
         (ticket_id, sender_type, sender_id, sender_name, content, content_type)
       VALUES ($1, 'admin', $2, $3, $4, 'text')
       RETURNING id`,
      [ticket.id, userId, userName, content]
    )

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('[admin/support POST] Failed:', error)
    return NextResponse.json({ error: '建立工單失敗' }, { status: 500 })
  }
}

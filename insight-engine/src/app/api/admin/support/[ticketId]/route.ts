import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed']
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent']

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
}

interface MessageRow extends Record<string, unknown> {
  id: string
  ticket_id: string
  sender_type: string
  sender_id: string | null
  sender_name: string | null
  content: string
  content_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
): Promise<NextResponse> {
  try {
    const { ticketId } = await params
    if (!UUID_REGEX.test(ticketId)) {
      return NextResponse.json({ error: '無效的工單 ID 格式' }, { status: 400 })
    }

    const { tenantId } = await getTenantContext()

    const ticket = await queryOne<TicketRow>(
      `SELECT * FROM support_tickets WHERE id = $1 AND tenant_id = $2`,
      [ticketId, tenantId]
    )
    if (!ticket) {
      return NextResponse.json({ error: '找不到該工單' }, { status: 404 })
    }

    const messages = await query<MessageRow>(
      `SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [ticketId]
    )

    return NextResponse.json({ ticket, messages })
  } catch (error) {
    console.error('[admin/support/:ticketId GET] Failed:', error)
    return NextResponse.json({ error: '取得工單詳情失敗' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  try {
    const { ticketId } = await params
    if (!UUID_REGEX.test(ticketId)) {
      return NextResponse.json({ error: '無效的工單 ID 格式' }, { status: 400 })
    }

    const { tenantId } = roleCheck

    const existing = await queryOne<TicketRow>(
      `SELECT * FROM support_tickets WHERE id = $1 AND tenant_id = $2`,
      [ticketId, tenantId]
    )
    if (!existing) {
      return NextResponse.json({ error: '找不到該工單' }, { status: 404 })
    }

    const body = await request.json()
    const sets: string[] = []
    const vals: unknown[] = []
    let idx = 1

    if (body.status && VALID_STATUSES.includes(body.status)) {
      sets.push(`status = $${idx++}`)
      vals.push(body.status)

      if (body.status === 'resolved' && existing.status !== 'resolved') {
        sets.push(`resolved_at = NOW()`)
      }
      if (body.status === 'open' && existing.status === 'resolved') {
        sets.push(`resolved_at = NULL`)
      }
    }

    if (body.priority && VALID_PRIORITIES.includes(body.priority)) {
      sets.push(`priority = $${idx++}`)
      vals.push(body.priority)
    }

    if (typeof body.category === 'string') {
      sets.push(`category = $${idx++}`)
      vals.push(body.category)
    }

    if (typeof body.assignedTo === 'string') {
      if (body.assignedTo && !UUID_REGEX.test(body.assignedTo)) {
        return NextResponse.json({ error: '無效的指派人員 ID' }, { status: 400 })
      }
      sets.push(`assigned_to = $${idx++}`)
      vals.push(body.assignedTo || null)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: '無有效更新欄位' }, { status: 400 })
    }

    sets.push('updated_at = NOW()')
    vals.push(ticketId)

    const updated = await queryOne<TicketRow>(
      `UPDATE support_tickets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[admin/support/:ticketId PATCH] Failed:', error)
    return NextResponse.json({ error: '更新工單失敗' }, { status: 500 })
  }
}

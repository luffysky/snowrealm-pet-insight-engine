import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'
import { sendAdminReplyToCustomer } from '@/lib/supportEngine'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface TicketRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  first_response_at: string | null
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

export async function POST(
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

    const { tenantId, userId, userName } = roleCheck

    const ticket = await queryOne<TicketRow>(
      `SELECT id, tenant_id, first_response_at FROM support_tickets WHERE id = $1 AND tenant_id = $2`,
      [ticketId, tenantId]
    )
    if (!ticket) {
      return NextResponse.json({ error: '找不到該工單' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '缺少回覆內容' }, { status: 400 })
    }

    const message = await queryOne<MessageRow>(
      `INSERT INTO support_messages
         (ticket_id, sender_type, sender_id, sender_name, content, content_type)
       VALUES ($1, 'admin', $2, $3, $4, 'text')
       RETURNING *`,
      [ticketId, userId, userName, content]
    )

    const updateParts = ['updated_at = NOW()']
    if (!ticket.first_response_at) {
      updateParts.push('first_response_at = NOW()')
    }
    await execute(
      `UPDATE support_tickets SET ${updateParts.join(', ')} WHERE id = $1`,
      [ticketId]
    )

    // 非阻塞：透過 LINE Official push 給顧客
    after(() => sendAdminReplyToCustomer(ticketId, content))

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('[admin/support/:ticketId/reply POST] Failed:', error)
    return NextResponse.json({ error: '回覆失敗' }, { status: 500 })
  }
}

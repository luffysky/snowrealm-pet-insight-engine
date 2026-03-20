import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

interface NotificationLogRow {
  id: string
  rule_id: string | null
  rule_name: string | null
  trigger_type: string
  recipient_type: string
  recipient_id: string
  response_id: string | null
  status: string
  error_message: string | null
  created_at: string
  [key: string]: unknown
}

// GET /api/admin/notification-logs?page=1&pageSize=20
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
  const offset = (page - 1) * pageSize

  const [logs, totalRow] = await Promise.all([
    query<NotificationLogRow>(
      `SELECT nl.*, nr.name AS rule_name
       FROM notification_logs nl
       LEFT JOIN notification_rules nr ON nr.id = nl.rule_id
       WHERE nl.tenant_id = $1
       ORDER BY nl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [(await getTenantContext()).tenantId, pageSize, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notification_logs WHERE tenant_id = $1`,
      [(await getTenantContext()).tenantId]
    ),
  ])

  return NextResponse.json({
    data: logs,
    total: parseInt(totalRow?.count ?? '0', 10),
    page,
    pageSize,
  })
}

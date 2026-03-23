import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

interface NotificationRuleRow {
  id: string
  survey_id: string | null
  name: string
  condition_type: string
  condition_config: Record<string, unknown>
  action_type: string
  message_template: string
  is_active: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// GET /api/admin/notification-rules
export async function GET(): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const rules = await query<NotificationRuleRow>(
    `SELECT * FROM notification_rules WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]
  )
  return NextResponse.json(rules)
}

// POST /api/admin/notification-rules
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const body = await request.json()
  const { name, condition_type, condition_config, action_type, message_template, survey_id } = body

  if (!name || !condition_type || !action_type) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  const validTypes = ['tag_match', 'completion']
  const validActions = ['line_push_admin', 'line_push_user']
  if (!validTypes.includes(condition_type) || !validActions.includes(action_type)) {
    return NextResponse.json({ error: '無效的類型' }, { status: 400 })
  }

  const row = await queryOne<NotificationRuleRow>(
    `INSERT INTO notification_rules (name, survey_id, condition_type, condition_config, action_type, message_template, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name,
      survey_id ?? null,
      condition_type,
      JSON.stringify(condition_config ?? {}),
      action_type,
      message_template ?? '',
      roleCheck.tenantId,
    ]
  )

  return NextResponse.json(row, { status: 201 })
}

// PUT /api/admin/notification-rules
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const body = await request.json()
  const { id, name, condition_type, condition_config, action_type, message_template, is_active, survey_id } = body

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const row = await queryOne<NotificationRuleRow>(
    `UPDATE notification_rules SET
       name = COALESCE($1, name),
       survey_id = $2,
       condition_type = COALESCE($3, condition_type),
       condition_config = COALESCE($4, condition_config),
       action_type = COALESCE($5, action_type),
       message_template = COALESCE($6, message_template),
       is_active = COALESCE($7, is_active),
       updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      name ?? null,
      survey_id ?? null,
      condition_type ?? null,
      condition_config ? JSON.stringify(condition_config) : null,
      action_type ?? null,
      message_template ?? null,
      is_active ?? null,
      id,
    ]
  )

  if (!row) {
    return NextResponse.json({ error: '規則不存在' }, { status: 404 })
  }

  return NextResponse.json(row)
}

// DELETE /api/admin/notification-rules
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const affected = await execute(
    `DELETE FROM notification_rules WHERE id = $1`,
    [id]
  )

  if (affected === 0) {
    return NextResponse.json({ error: '規則不存在' }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

interface TemplateRow {
  id: string
  name: string
  type: string
  content: string
  flex_json: Record<string, unknown> | null
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// GET /api/admin/templates
export async function GET(): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const rows = await query<TemplateRow>(
    `SELECT * FROM message_templates WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]
  )
  return NextResponse.json(rows)
}

// POST /api/admin/templates
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { name, type, content, flex_json, category } = body

  if (!name || !type) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }
  if (!['text', 'flex'].includes(type)) {
    return NextResponse.json({ error: '無效的模板類型' }, { status: 400 })
  }

  const row = await queryOne<TemplateRow>(
    `INSERT INTO message_templates (name, type, content, flex_json, category, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, type, content ?? '', flex_json ? JSON.stringify(flex_json) : null, category ?? 'general', (await getTenantContext()).tenantId]
  )

  return NextResponse.json(row, { status: 201 })
}

// PUT /api/admin/templates
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { id, name, type, content, flex_json, category, is_active } = body

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const row = await queryOne<TemplateRow>(
    `UPDATE message_templates SET
       name = COALESCE($1, name),
       type = COALESCE($2, type),
       content = COALESCE($3, content),
       flex_json = COALESCE($4, flex_json),
       category = COALESCE($5, category),
       is_active = COALESCE($6, is_active),
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      name ?? null,
      type ?? null,
      content ?? null,
      flex_json ? JSON.stringify(flex_json) : null,
      category ?? null,
      is_active ?? null,
      id,
    ]
  )

  if (!row) return NextResponse.json({ error: '模板不存在' }, { status: 404 })
  return NextResponse.json(row)
}

// DELETE /api/admin/templates
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const affected = await execute('DELETE FROM message_templates WHERE id = $1', [id])
  if (affected === 0) return NextResponse.json({ error: '模板不存在' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}

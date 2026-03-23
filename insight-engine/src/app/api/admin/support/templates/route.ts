import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface TemplateRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  title: string
  content: string
  category: string | null
  usage_count: number
  created_at: string
}

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()

    const rows = await query<TemplateRow>(
      `SELECT * FROM support_templates
       WHERE tenant_id = $1
       ORDER BY usage_count DESC, created_at DESC`,
      [tenantId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error('[admin/support/templates GET] Failed:', error)
    return NextResponse.json({ error: '取得模板列表失敗' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  try {
    const { tenantId } = roleCheck
    const body = await request.json()
    const { title, content, category } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: '缺少模板標題' }, { status: 400 })
    }
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '缺少模板內容' }, { status: 400 })
    }

    const row = await queryOne<TemplateRow>(
      `INSERT INTO support_templates (tenant_id, title, content, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, title, content, category ?? null]
    )

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('[admin/support/templates POST] Failed:', error)
    return NextResponse.json({ error: '建立模板失敗' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  try {
    const { tenantId } = roleCheck
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少模板 ID' }, { status: 400 })
    }
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: '無效的模板 ID 格式' }, { status: 400 })
    }

    const affected = await execute(
      `DELETE FROM support_templates WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (affected === 0) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[admin/support/templates DELETE] Failed:', error)
    return NextResponse.json({ error: '刪除模板失敗' }, { status: 500 })
  }
}

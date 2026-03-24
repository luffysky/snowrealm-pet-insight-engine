import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

interface TemplateFullRow extends Record<string, unknown> {
  id: string
  source: string
  tenant_id: string | null
  created_by: string | null
  name: string
  description: string | null
  industry: string | null
  icon: string
  tags: string[]
  survey_config: unknown
  questions: unknown
  branch_config: unknown
  use_count: number
  rating_sum: number
  rating_count: number
  is_public: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// GET /api/admin/survey-templates/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const { id } = await params

  try {
    const row = await queryOne<TemplateFullRow>(
      `SELECT * FROM survey_templates
       WHERE id = $1 AND is_active = true
         AND (source = 'platform' OR tenant_id = $2 OR (source = 'marketplace' AND is_public = true))`,
      [id, tenantId]
    )
    if (!row) {
      return NextResponse.json({ error: '模板不存在或無權限' }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (err) {
    console.error('[survey-templates/[id] GET]', err)
    return NextResponse.json({ error: '取得模板失敗' }, { status: 500 })
  }
}

// PATCH /api/admin/survey-templates/[id]
// body: { name?, description?, industry?, icon?, isPublic? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const { id } = await params

  const existing = await queryOne<{ tenant_id: string | null; source: string }>(
    `SELECT tenant_id, source FROM survey_templates WHERE id = $1 AND is_active = true`,
    [id]
  )
  if (!existing) {
    return NextResponse.json({ error: '模板不存在' }, { status: 404 })
  }
  // 只有模板擁有者（同租戶）或平台管理員才能修改
  if (existing.source !== 'platform' && existing.tenant_id !== tenantId) {
    return NextResponse.json({ error: '無權限修改此模板' }, { status: 403 })
  }

  const body = await request.json() as {
    name?: string
    description?: string
    industry?: string
    icon?: string
    isPublic?: boolean
  }

  const setClauses: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    values.push(body.name.trim())
    setClauses.push(`name = $${values.length}`)
  }
  if (body.description !== undefined) {
    values.push(body.description?.trim() ?? null)
    setClauses.push(`description = $${values.length}`)
  }
  if (body.industry !== undefined) {
    values.push(body.industry ?? null)
    setClauses.push(`industry = $${values.length}`)
  }
  if (body.icon !== undefined) {
    values.push(body.icon)
    setClauses.push(`icon = $${values.length}`)
  }
  if (body.isPublic !== undefined) {
    values.push(body.isPublic)
    setClauses.push(`is_public = $${values.length}`)
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: '沒有提供任何更新欄位' }, { status: 400 })
  }

  values.push(id)
  const sql = `UPDATE survey_templates SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`

  try {
    await execute(sql, values)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[survey-templates/[id] PATCH]', err)
    return NextResponse.json({ error: '更新模板失敗' }, { status: 500 })
  }
}

// DELETE /api/admin/survey-templates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const { id } = await params

  const existing = await queryOne<{ tenant_id: string | null; source: string }>(
    `SELECT tenant_id, source FROM survey_templates WHERE id = $1 AND is_active = true`,
    [id]
  )
  if (!existing) {
    return NextResponse.json({ error: '模板不存在' }, { status: 404 })
  }
  // 只有同租戶的模板可以刪除（平台模板不能刪）
  if (existing.source === 'platform') {
    return NextResponse.json({ error: '平台模板無法刪除' }, { status: 403 })
  }
  if (existing.tenant_id !== tenantId) {
    return NextResponse.json({ error: '無權限刪除此模板' }, { status: 403 })
  }

  try {
    // 軟刪除
    await execute(`UPDATE survey_templates SET is_active = false WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[survey-templates/[id] DELETE]', err)
    return NextResponse.json({ error: '刪除模板失敗' }, { status: 500 })
  }
}


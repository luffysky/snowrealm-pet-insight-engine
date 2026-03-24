import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

interface TemplateRow extends Record<string, unknown> {
  id: string
  source: string
  tenant_id: string | null
  name: string
  description: string | null
  industry: string | null
  icon: string
  tags: string[]
  use_count: number
  rating_sum: number
  rating_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
}

// GET /api/admin/survey-templates
// ?source=platform|tenant|marketplace|all  &industry=pet  &search=xxx
export async function GET(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')
  const industry = searchParams.get('industry')
  const search = searchParams.get('search')

  // 平台模板 + 本租戶模板 + 公開市集模板
  let sql = `
    SELECT id, source, tenant_id, name, description, industry, icon, tags,
           use_count, rating_sum, rating_count, is_public, is_featured, created_at
    FROM survey_templates
    WHERE is_active = true
      AND (
        source = 'platform'
        OR (source = 'tenant' AND tenant_id = $1)
        OR (source = 'marketplace' AND is_public = true)
      )
  `
  const params: unknown[] = [tenantId]

  if (source && source !== 'all') {
    params.push(source)
    sql += ` AND source = $${params.length}`
  }
  if (industry && industry !== 'all') {
    params.push(industry)
    sql += ` AND industry = $${params.length}`
  }
  if (search) {
    params.push(`%${search}%`)
    const idx = params.length
    sql += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`
  }

  sql += ` ORDER BY is_featured DESC, use_count DESC, created_at DESC LIMIT 100`

  try {
    const rows = await query<TemplateRow>(sql, params)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[survey-templates GET]', err)
    return NextResponse.json({ error: '載入模板失敗' }, { status: 500 })
  }
}

// POST /api/admin/survey-templates
// body: { name, description?, industry?, icon?, surveyConfig, questions, branchConfig?, source?, isPublic? }
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId, userId } = roleCheck

  const body = await request.json() as {
    name?: string
    description?: string
    industry?: string
    icon?: string
    surveyConfig?: unknown
    questions?: unknown
    branchConfig?: unknown
    source?: string
    isPublic?: boolean
  }

  const { name, description, industry, icon, surveyConfig, questions, branchConfig, source = 'tenant', isPublic = false } = body

  if (!name?.trim() || !surveyConfig || !questions) {
    return NextResponse.json({ error: '缺少必要欄位：name、surveyConfig、questions' }, { status: 400 })
  }

  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO survey_templates
         (source, tenant_id, created_by, name, description, industry, icon,
          survey_config, questions, branch_config, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        source,
        tenantId,
        userId,
        name.trim(),
        description?.trim() ?? null,
        industry ?? null,
        icon ?? '📋',
        JSON.stringify(surveyConfig),
        JSON.stringify(questions),
        branchConfig ? JSON.stringify(branchConfig) : null,
        isPublic,
      ]
    )
    return NextResponse.json({ id: row?.id }, { status: 201 })
  } catch (err) {
    console.error('[survey-templates POST]', err)
    return NextResponse.json({ error: '建立模板失敗' }, { status: 500 })
  }
}

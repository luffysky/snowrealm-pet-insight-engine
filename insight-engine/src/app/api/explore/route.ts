import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface ExploreRow extends Record<string, unknown> {
  id: string
  slug: string
  title: string
  subtitle: string
  cover_title: string
  tenant_id: string
  response_count: string
  created_at: string
}

/** GET /api/explore — 公開探索頁問卷列表 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') ?? 'popular'     // 'popular' | 'new'
  const search = searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = 12
  const offset = (page - 1) * pageSize

  const orderBy = sort === 'new' ? 's.created_at DESC' : 'response_count DESC'
  const searchClause = search
    ? `AND (s.title ILIKE $3 OR s.subtitle ILIKE $3)`
    : ''
  const params: unknown[] = [pageSize, offset]
  if (search) params.push(`%${search}%`)

  const rows = await query<ExploreRow>(
    `SELECT s.id, s.slug, s.title, s.subtitle, s.cover_title, s.tenant_id,
            COUNT(r.id)::text AS response_count, s.created_at
     FROM surveys s
     LEFT JOIN responses r ON r.survey_id = s.id AND r.status = 'completed'
     WHERE s.is_public_explore = true AND s.status = 'published'
     ${searchClause}
     GROUP BY s.id
     ORDER BY ${orderBy}
     LIMIT $1 OFFSET $2`,
    params
  )

  return NextResponse.json({
    surveys: rows.map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      coverTitle: r.cover_title,
      tenantId: r.tenant_id,
      responseCount: parseInt(r.response_count, 10),
      createdAt: r.created_at,
    })),
    page,
    pageSize,
  })
}

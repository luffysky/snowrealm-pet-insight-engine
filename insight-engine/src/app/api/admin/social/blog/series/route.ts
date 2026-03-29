import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, queryOne, execute } from '@/lib/db'

interface SeriesRow extends Record<string, unknown> {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image: string | null
  is_completed: boolean
  article_count?: number
  created_at: string
  updated_at: string
}

/** GET /api/admin/social/blog/series — 列出自己的所有系列 */
export async function GET(_req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const series = await query<SeriesRow>(
    `SELECT s.*, COUNT(a.id)::int AS article_count
     FROM blog_series s
     LEFT JOIN user_blog_articles a ON a.series_id = s.id
     WHERE s.user_id::text = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [ctx.userId]
  )

  return NextResponse.json({ series })
}

/** POST /api/admin/social/blog/series — 建立新系列 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    title: string
    description?: string
    coverImage?: string
    isCompleted?: boolean
  }

  if (!body.title?.trim()) return NextResponse.json({ error: '請輸入系列標題' }, { status: 400 })

  const series = await queryOne<SeriesRow>(
    `INSERT INTO blog_series (user_id, title, description, cover_image, is_completed)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ctx.userId, body.title.trim(), body.description ?? null, body.coverImage ?? null, body.isCompleted ?? false]
  )

  return NextResponse.json({ series }, { status: 201 })
}

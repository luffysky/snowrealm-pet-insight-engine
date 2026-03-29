import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne, execute } from '@/lib/db'

interface SeriesRow extends Record<string, unknown> {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    title?: string
    description?: string | null
    coverImage?: string | null
    isCompleted?: boolean
  }

  const series = await queryOne<SeriesRow>(
    `UPDATE blog_series SET
       title        = COALESCE($1, title),
       description  = CASE WHEN $2::boolean THEN $3 ELSE description END,
       cover_image  = CASE WHEN $4::boolean THEN $5 ELSE cover_image END,
       is_completed = COALESCE($6, is_completed),
       updated_at   = NOW()
     WHERE id::text = $7 AND user_id::text = $8
     RETURNING *`,
    [
      body.title ?? null,
      'description' in body, body.description ?? null,
      'coverImage' in body, body.coverImage ?? null,
      body.isCompleted ?? null,
      id, ctx.userId,
    ]
  )
  if (!series) return NextResponse.json({ error: '找不到系列或無權限' }, { status: 404 })

  return NextResponse.json({ series })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  // 先解除文章的系列關聯，再刪系列
  await execute(
    `UPDATE user_blog_articles SET series_id = NULL, series_order = NULL WHERE series_id::text = $1`,
    [id]
  )

  const count = await execute(
    `DELETE FROM blog_series WHERE id::text = $1 AND user_id::text = $2`,
    [id, ctx.userId]
  )
  if (count === 0) return NextResponse.json({ error: '找不到系列或無權限' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

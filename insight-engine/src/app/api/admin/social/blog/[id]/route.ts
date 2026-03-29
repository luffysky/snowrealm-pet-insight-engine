import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne, execute } from '@/lib/db'

interface BlogArticleRow extends Record<string, unknown> {
  id: string
  user_id: string
  title: string
  slug: string
  summary: string | null
  content: string
  cover_image: string | null
  cover_image_position: string | null
  tags: string[]
  is_public: boolean
  view_count: number
  seo_title: string | null
  seo_desc: string | null
  series_id: string | null
  series_order: number | null
  series_title?: string | null
  series_is_completed?: boolean | null
  published_at: string
  created_at: string
  updated_at: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const article = await queryOne<BlogArticleRow>(
    `SELECT a.*, s.title AS series_title, s.is_completed AS series_is_completed
     FROM user_blog_articles a
     LEFT JOIN blog_series s ON s.id = a.series_id
     WHERE a.id::text = $1 AND a.user_id::text = $2`,
    [id, ctx.userId]
  )
  if (!article) return NextResponse.json({ error: '找不到文章' }, { status: 404 })

  return NextResponse.json({ article })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    title?: string
    slug?: string
    summary?: string | null
    content?: string
    coverImage?: string | null
    coverImagePosition?: string | null
    tags?: string[]
    isPublic?: boolean
    seoTitle?: string | null
    seoDesc?: string | null
    seriesId?: string | null
    seriesOrder?: number | null
  }

  // 如果要改 slug，先確認唯一性
  if (body.slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: 'Slug 只能包含小寫英文、數字和連字號' }, { status: 400 })
    }
    const conflict = await queryOne<{ id: string }>(
      `SELECT id FROM user_blog_articles WHERE user_id::text = $1 AND slug = $2 AND id::text != $3`,
      [ctx.userId, body.slug, id]
    )
    if (conflict) return NextResponse.json({ error: '此 slug 已被使用' }, { status: 409 })
  }

  const article = await queryOne<BlogArticleRow>(
    `UPDATE user_blog_articles SET
       title                = COALESCE($1, title),
       slug                 = COALESCE($2, slug),
       summary              = CASE WHEN $3::boolean THEN $4 ELSE summary END,
       content              = COALESCE($5, content),
       cover_image          = CASE WHEN $6::boolean THEN $7 ELSE cover_image END,
       cover_image_position = COALESCE($8, cover_image_position),
       tags                 = COALESCE($9, tags),
       is_public            = COALESCE($10, is_public),
       seo_title            = CASE WHEN $11::boolean THEN $12 ELSE seo_title END,
       seo_desc             = CASE WHEN $13::boolean THEN $14 ELSE seo_desc END,
       series_id            = CASE WHEN $15::boolean THEN $16::uuid ELSE series_id END,
       series_order         = CASE WHEN $17::boolean THEN $18 ELSE series_order END,
       updated_at           = NOW()
     WHERE id::text = $19 AND user_id::text = $20
     RETURNING *`,
    [
      body.title ?? null,
      body.slug ?? null,
      'summary' in body, body.summary ?? null,
      body.content ?? null,
      'coverImage' in body, body.coverImage ?? null,
      body.coverImagePosition ?? null,
      body.tags ?? null,
      body.isPublic ?? null,
      'seoTitle' in body, body.seoTitle ?? null,
      'seoDesc' in body, body.seoDesc ?? null,
      'seriesId' in body, body.seriesId ?? null,
      'seriesOrder' in body, body.seriesOrder ?? null,
      id, ctx.userId,
    ]
  )
  if (!article) return NextResponse.json({ error: '找不到文章或無權限' }, { status: 404 })

  return NextResponse.json({ article })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const count = await execute(
    `DELETE FROM user_blog_articles WHERE id::text = $1 AND user_id::text = $2`,
    [id, ctx.userId]
  )
  if (count === 0) return NextResponse.json({ error: '找不到文章或無權限' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

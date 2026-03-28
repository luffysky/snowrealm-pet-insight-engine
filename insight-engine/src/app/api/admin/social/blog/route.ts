import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, queryOne, execute } from '@/lib/db'

interface BlogArticleRow extends Record<string, unknown> {
  id: string
  user_id: string
  title: string
  slug: string
  summary: string | null
  content: string
  cover_image: string | null
  tags: string[]
  is_public: boolean
  view_count: number
  seo_title: string | null
  seo_desc: string | null
  published_at: string
  created_at: string
  updated_at: string
}

/** GET /api/admin/social/blog — 列出自己的所有文章（含私人） */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const articles = await query<BlogArticleRow>(
    `SELECT id, user_id, title, slug, summary, content, cover_image, tags,
            is_public, view_count, seo_title, seo_desc, published_at, created_at, updated_at
     FROM user_blog_articles
     WHERE user_id::text = $1
     ORDER BY published_at DESC`,
    [ctx.userId]
  )

  return NextResponse.json({ articles })
}

/** POST /api/admin/social/blog — 建立新文章 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    title: string
    slug: string
    summary?: string
    content?: string
    coverImage?: string
    tags?: string[]
    isPublic?: boolean
    seoTitle?: string
    seoDesc?: string
  }

  if (!body.title?.trim()) return NextResponse.json({ error: '缺少標題' }, { status: 400 })
  if (!body.slug?.trim()) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json({ error: 'Slug 只能包含小寫英文、數字和連字號' }, { status: 400 })
  }

  // 確認 slug 在此用戶下唯一
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM user_blog_articles WHERE user_id::text = $1 AND slug = $2`,
    [ctx.userId, body.slug]
  )
  if (existing) return NextResponse.json({ error: '此 slug 已被使用' }, { status: 409 })

  const article = await queryOne<BlogArticleRow>(
    `INSERT INTO user_blog_articles
       (user_id, tenant_id, title, slug, summary, content, cover_image, tags, is_public, seo_title, seo_desc)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      ctx.userId, ctx.tenantId ?? 'default',
      body.title.trim(), body.slug.trim(),
      body.summary ?? null,
      body.content ?? '',
      body.coverImage ?? null,
      body.tags ?? [],
      body.isPublic ?? true,
      body.seoTitle ?? null,
      body.seoDesc ?? null,
    ]
  )

  return NextResponse.json({ article }, { status: 201 })
}

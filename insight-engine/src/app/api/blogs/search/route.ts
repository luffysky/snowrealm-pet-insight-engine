import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface SearchResultRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  tags: string[]
  view_count: number
  published_at: string
  author_name: string | null
  blog_slug: string | null
  blog_title: string | null
}

/** GET /api/blogs/search?q=keyword&page=1&limit=10
 *  跨部落格全文搜尋公開文章
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
  const offset = (page - 1) * limit

  const rows = await query<SearchResultRow>(
    `SELECT
       a.id, a.title, a.slug, a.summary, a.cover_image, a.tags, a.view_count, a.published_at,
       au.display_name AS author_name,
       ubs.blog_slug,
       ubs.blog_title
     FROM user_blog_articles a
     JOIN admin_users au ON au.id = a.user_id
     JOIN user_blog_settings ubs ON ubs.user_id = a.user_id
     WHERE a.is_public = true
       AND ubs.is_enabled = true
       AND (
         $1::text = '' OR
         a.title ILIKE '%' || $1 || '%' OR
         a.summary ILIKE '%' || $1 || '%' OR
         $1 = ANY(a.tags)
       )
     ORDER BY a.published_at DESC
     LIMIT $2 OFFSET $3`,
    [q, limit, offset]
  )

  return NextResponse.json({
    query: q,
    page,
    limit,
    articles: rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      coverImage: r.cover_image,
      tags: r.tags ?? [],
      viewCount: r.view_count,
      publishedAt: r.published_at,
      authorName: r.author_name,
      blogSlug: r.blog_slug,
      blogTitle: r.blog_title,
      url: `/blogs/${r.blog_slug ?? r.id}/${r.slug}`,
    })),
  })
}

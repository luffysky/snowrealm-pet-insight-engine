import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface BlogRow extends Record<string, unknown> {
  user_id: string
  blog_slug: string | null
  blog_title: string | null
  blog_desc: string | null
  display_name: string | null
  avatar_url: string | null
  article_count: string
  latest_published_at: string | null
}

interface ArticleSearchRow extends Record<string, unknown> {
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

/** GET /api/blogs — 取得所有啟用中的公開部落格列表
 *  可選 ?search=keyword 同時搜尋文章（標題 / 摘要 / 標籤）
 */
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim() ?? ''

  // 若有搜尋關鍵字，跨部落格搜尋文章
  if (search) {
    const articles = await query<ArticleSearchRow>(
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
           a.title ILIKE '%' || $1 || '%' OR
           a.summary ILIKE '%' || $1 || '%' OR
           $1 = ANY(a.tags)
         )
       ORDER BY a.published_at DESC
       LIMIT 50`,
      [search]
    )

    return NextResponse.json({
      search,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        coverImage: a.cover_image,
        tags: a.tags ?? [],
        viewCount: a.view_count,
        publishedAt: a.published_at,
        authorName: a.author_name,
        blogSlug: a.blog_slug,
        blogTitle: a.blog_title,
        url: `/blogs/${a.blog_slug ?? a.id}/${a.slug}`,
      })),
    })
  }

  // 無搜尋關鍵字：回傳部落格列表
  const rows = await query<BlogRow>(
    `SELECT
       ubs.user_id,
       ubs.blog_slug,
       ubs.blog_title,
       ubs.blog_desc,
       au.display_name,
       au.avatar_url,
       COUNT(a.id) AS article_count,
       MAX(a.published_at) AS latest_published_at
     FROM user_blog_settings ubs
     JOIN admin_users au ON au.id = ubs.user_id
     LEFT JOIN user_blog_articles a ON a.user_id = ubs.user_id AND a.is_public = true
     WHERE ubs.is_enabled = true
     GROUP BY ubs.user_id, ubs.blog_slug, ubs.blog_title, ubs.blog_desc, au.display_name, au.avatar_url
     HAVING COUNT(a.id) > 0
     ORDER BY MAX(a.published_at) DESC NULLS LAST
     LIMIT 50`
  )

  return NextResponse.json({
    blogs: rows.map(r => ({
      userSlug: (r.blog_slug as string | null) ?? (r.user_id as string),
      blogTitle: r.blog_title as string | null,
      blogDesc: r.blog_desc as string | null,
      authorName: r.display_name as string | null,
      authorAvatar: r.avatar_url as string | null,
      articleCount: parseInt(r.article_count as string, 10),
      latestPublishedAt: r.latest_published_at as string | null,
    })),
  })
}

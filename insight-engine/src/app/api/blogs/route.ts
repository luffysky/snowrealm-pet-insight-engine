import { NextResponse } from 'next/server'
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

/** GET /api/blogs — 取得所有啟用中的公開部落格列表 */
export async function GET() {
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

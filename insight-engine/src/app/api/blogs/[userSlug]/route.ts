import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

interface BlogArticleRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  cover_image_position: string | null
  tags: string[]
  category: string | null
  view_count: number
  published_at: string
}

interface BlogSettingsRow extends Record<string, unknown> {
  user_id: string
  blog_slug: string | null
  blog_title: string | null
  blog_desc: string | null
  is_enabled: boolean
  display_name: string | null
  avatar_url: string | null
}

/** GET /api/blogs/[userSlug] — 取得公開部落格資訊與文章列表 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  const { userSlug } = await params
  const categoryFilter = req.nextUrl.searchParams.get('category') || null

  // 先嘗試以 blog_slug 查找，若找不到再以 user_id 查找
  let owner = await queryOne<BlogSettingsRow>(
    `SELECT ubs.user_id, ubs.blog_slug, ubs.blog_title, ubs.blog_desc, ubs.is_enabled,
            au.display_name, au.avatar_url
     FROM user_blog_settings ubs
     JOIN admin_users au ON au.id = ubs.user_id
     WHERE ubs.blog_slug = $1 AND ubs.is_enabled = true`,
    [userSlug]
  )

  if (!owner) {
    // fallback: userSlug 可能是 user_id
    owner = await queryOne<BlogSettingsRow>(
      `SELECT ubs.user_id, ubs.blog_slug, ubs.blog_title, ubs.blog_desc,
              COALESCE(ubs.is_enabled, true) AS is_enabled,
              au.display_name, au.avatar_url
       FROM admin_users au
       LEFT JOIN user_blog_settings ubs ON ubs.user_id = au.id
       WHERE au.id::text = $1`,
      [userSlug]
    )
    if (!owner) return NextResponse.json({ error: '找不到部落格' }, { status: 404 })
    if (owner.is_enabled === false) return NextResponse.json({ error: '部落格未啟用' }, { status: 404 })
  }

  const articleParams: unknown[] = [owner.user_id as string]
  let articleQuery = `SELECT id, title, slug, summary, cover_image, cover_image_position, tags, category, view_count, published_at
     FROM user_blog_articles
     WHERE user_id::text = $1 AND is_public = true`
  if (categoryFilter) {
    articleQuery += ` AND category = $2`
    articleParams.push(categoryFilter)
  }
  articleQuery += ` ORDER BY published_at DESC`
  const articles = await query<BlogArticleRow>(articleQuery, articleParams)

  // Collect distinct categories for filter UI
  const categoriesResult = await query<{ category: string }>(
    `SELECT DISTINCT category FROM user_blog_articles
     WHERE user_id::text = $1 AND is_public = true AND category IS NOT NULL
     ORDER BY category`,
    [owner.user_id as string]
  )
  const categories = categoriesResult.map(r => r.category)

  return NextResponse.json({
    blog: {
      userSlug: (owner.blog_slug as string | null) ?? (owner.user_id as string),
      blogTitle: owner.blog_title as string | null,
      blogDesc: owner.blog_desc as string | null,
      authorName: owner.display_name as string | null,
      authorAvatar: owner.avatar_url as string | null,
    },
    articles,
    categories,
  })
}

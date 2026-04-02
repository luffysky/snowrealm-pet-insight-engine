import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

interface SeriesRow extends Record<string, unknown> {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  is_completed: boolean
}

interface ArticleRow extends Record<string, unknown> {
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
  series_order: number | null
}

interface BlogOwner extends Record<string, unknown> {
  user_id: string
  blog_slug: string | null
  blog_title: string | null
  display_name: string | null
  avatar_url: string | null
}

/** GET /api/blogs/[userSlug]/series/[seriesId] — 取得系列文章 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; seriesId: string }> }
) {
  const { userSlug, seriesId } = await params

  // 找到部落格主人
  let owner = await queryOne<BlogOwner>(
    `SELECT ubs.user_id, ubs.blog_slug, ubs.blog_title, au.display_name, au.avatar_url
     FROM user_blog_settings ubs
     JOIN admin_users au ON au.id = ubs.user_id
     WHERE ubs.blog_slug = $1 AND ubs.is_enabled = true`,
    [userSlug]
  )
  if (!owner) {
    owner = await queryOne<BlogOwner>(
      `SELECT ubs.user_id, ubs.blog_slug, ubs.blog_title, au.display_name, au.avatar_url
       FROM admin_users au
       LEFT JOIN user_blog_settings ubs ON ubs.user_id = au.id
       WHERE au.id::text = $1`,
      [userSlug]
    )
  }
  if (!owner) return NextResponse.json({ error: '找不到部落格' }, { status: 404 })

  // 取得系列資訊
  const series = await queryOne<SeriesRow>(
    `SELECT id, title, description, cover_image, is_completed
     FROM blog_series WHERE id = $1 AND user_id::text = $2`,
    [seriesId, owner.user_id as string]
  )
  if (!series) return NextResponse.json({ error: '找不到系列' }, { status: 404 })

  // 取得系列內的文章（按 series_order 排序）
  const articles = await query<ArticleRow>(
    `SELECT id, title, slug, summary, cover_image, cover_image_position, tags, category,
            view_count, published_at, series_order
     FROM user_blog_articles
     WHERE series_id = $1 AND is_public = true
     ORDER BY COALESCE(series_order, 999), published_at ASC`,
    [seriesId]
  )

  return NextResponse.json({
    blog: {
      userSlug: (owner.blog_slug as string | null) ?? (owner.user_id as string),
      blogTitle: owner.blog_title as string | null,
      authorName: owner.display_name as string | null,
      authorAvatar: owner.avatar_url as string | null,
    },
    series,
    articles,
  })
}

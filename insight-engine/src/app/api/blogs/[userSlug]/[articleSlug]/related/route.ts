import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

interface RelatedArticleRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  tags: string[]
  published_at: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params

  // Resolve user_id from blog_slug or user_id fallback
  const ownerRow = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_blog_settings WHERE blog_slug = $1`,
    [userSlug]
  ) ?? await queryOne<{ user_id: string }>(
    `SELECT id AS user_id FROM admin_users WHERE id::text = $1`,
    [userSlug]
  )

  if (!ownerRow) {
    return NextResponse.json({ articles: [] })
  }

  // Resolve the current article id and its tags
  const currentArticle = await queryOne<{ id: string; tags: string[] }>(
    `SELECT id, tags FROM user_blog_articles
     WHERE user_id::text = $1 AND slug = $2 AND is_public = true`,
    [ownerRow.user_id, articleSlug]
  )

  if (!currentArticle || !currentArticle.tags || currentArticle.tags.length === 0) {
    return NextResponse.json({ articles: [] })
  }

  // Fetch related articles: same user, overlapping tags, exclude current, public only
  const related = await query<RelatedArticleRow>(
    `SELECT id, title, slug, summary, cover_image, tags, published_at
     FROM user_blog_articles
     WHERE user_id::text = $1
       AND id != $2
       AND is_public = true
       AND tags && $3
     ORDER BY published_at DESC
     LIMIT 3`,
    [ownerRow.user_id, currentArticle.id, currentArticle.tags]
  )

  return NextResponse.json({ articles: related })
}

import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, queryOne } from '@/lib/db'

interface CountRow extends Record<string, unknown> { count: number }
interface SumRow extends Record<string, unknown> { total: number }
interface TopArticleRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  view_count: number
  comment_count: number
  published_at: string
  is_public: boolean
}
interface CategoryRow extends Record<string, unknown> {
  category: string
  count: number
}
interface TrendRow extends Record<string, unknown> {
  date: string
  views: number
}

/** GET /api/admin/social/blog/stats */
export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const userId = ctx.userId

  const [
    totalRow,
    publishedRow,
    viewsRow,
    commentsRow,
    reactionsRow,
    subscribersRow,
    topByViews,
    topByComments,
    categoryDist,
    viewsTrend,
  ] = await Promise.all([
    // Total articles
    queryOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM user_blog_articles WHERE user_id::text = $1`,
      [userId]
    ),
    // Published articles
    queryOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM user_blog_articles WHERE user_id::text = $1 AND is_public = true`,
      [userId]
    ),
    // Total views
    queryOne<SumRow>(
      `SELECT COALESCE(SUM(view_count), 0)::int AS total FROM user_blog_articles WHERE user_id::text = $1`,
      [userId]
    ),
    // Total comments
    queryOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM blog_comments bc
       JOIN user_blog_articles a ON a.id = bc.article_id
       WHERE a.user_id::text = $1`,
      [userId]
    ),
    // Total reactions
    queryOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM blog_reactions br
       JOIN user_blog_articles a ON a.id = br.article_id
       WHERE a.user_id::text = $1`,
      [userId]
    ),
    // Total subscribers
    queryOne<CountRow>(
      `SELECT COUNT(*)::int AS count FROM blog_subscribers WHERE blog_user_id::text = $1`,
      [userId]
    ),
    // Top 5 by views
    query<TopArticleRow>(
      `SELECT a.id, a.title, a.slug, a.view_count, a.is_public, a.published_at,
              (SELECT COUNT(*)::int FROM blog_comments bc WHERE bc.article_id = a.id) AS comment_count
       FROM user_blog_articles a
       WHERE a.user_id::text = $1
       ORDER BY a.view_count DESC
       LIMIT 5`,
      [userId]
    ),
    // Top 5 by comments
    query<TopArticleRow>(
      `SELECT a.id, a.title, a.slug, a.view_count, a.is_public, a.published_at,
              (SELECT COUNT(*)::int FROM blog_comments bc WHERE bc.article_id = a.id) AS comment_count
       FROM user_blog_articles a
       WHERE a.user_id::text = $1
       ORDER BY comment_count DESC
       LIMIT 5`,
      [userId]
    ),
    // Category distribution
    query<CategoryRow>(
      `SELECT COALESCE(category, '未分類') AS category, COUNT(*)::int AS count
       FROM user_blog_articles
       WHERE user_id::text = $1
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    ),
    // Views trend (last 30 days, by published_at)
    query<TrendRow>(
      `SELECT TO_CHAR(published_at, 'YYYY-MM-DD') AS date, SUM(view_count)::int AS views
       FROM user_blog_articles
       WHERE user_id::text = $1 AND published_at >= NOW() - INTERVAL '30 days'
       GROUP BY TO_CHAR(published_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [userId]
    ),
  ])

  const totalArticles = totalRow?.count ?? 0
  const publishedArticles = publishedRow?.count ?? 0
  const draftCount = totalArticles - publishedArticles

  return NextResponse.json({
    summary: {
      totalArticles,
      publishedArticles,
      draftCount,
      totalViews: viewsRow?.total ?? 0,
      totalComments: commentsRow?.count ?? 0,
      totalReactions: reactionsRow?.count ?? 0,
      totalSubscribers: subscribersRow?.count ?? 0,
    },
    topByViews: topByViews ?? [],
    topByComments: topByComments ?? [],
    categoryDistribution: categoryDist ?? [],
    viewsTrend: viewsTrend ?? [],
  })
}

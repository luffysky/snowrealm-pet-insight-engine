import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

interface ArticleRow extends Record<string, unknown> {
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
  author_name: string | null
  author_avatar: string | null
  blog_slug: string | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params

  // 解析 user_id（先試 blog_slug，再試 user_id）
  const ownerRow = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_blog_settings WHERE blog_slug = $1`,
    [userSlug]
  ) ?? await queryOne<{ user_id: string }>(
    `SELECT id AS user_id FROM admin_users WHERE id::text = $1`,
    [userSlug]
  )

  if (!ownerRow) return NextResponse.json({ error: '找不到部落格' }, { status: 404 })

  const article = await queryOne<ArticleRow>(
    `SELECT a.*, au.display_name AS author_name, au.avatar_url AS author_avatar,
            ubs.blog_slug
     FROM user_blog_articles a
     JOIN admin_users au ON au.id = a.user_id
     LEFT JOIN user_blog_settings ubs ON ubs.user_id = a.user_id
     WHERE a.user_id::text = $1 AND a.slug = $2`,
    [ownerRow.user_id, articleSlug]
  )

  if (!article) return NextResponse.json({ error: '找不到文章' }, { status: 404 })

  // 私人文章：需確認是作者本人
  if (!article.is_public) {
    const ctx = await getTenantContext()
    if (ctx.userId !== article.user_id) {
      return NextResponse.json({ error: '此文章為私人' }, { status: 403 })
    }
  }

  // 增加瀏覽次數（非同步，不影響回應速度）
  execute(
    `UPDATE user_blog_articles SET view_count = view_count + 1 WHERE id = $1`,
    [article.id]
  ).catch(() => {})

  return NextResponse.json({ article })
}

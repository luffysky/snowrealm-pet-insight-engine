import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { verifyPassword } from '@/lib/auth'

/** 驗證 preview token：與 preview-token route 保持一致的雜湊邏輯 */
async function verifyPreviewToken(articleId: string, token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET ?? process.env.ADMIN_SECRET
  if (!secret) return false
  const data = new TextEncoder().encode(articleId + secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashBytes = new Uint8Array(hashBuffer)
  let binary = ''
  for (let i = 0; i < hashBytes.length; i++) binary += String.fromCharCode(hashBytes[i])
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return b64.slice(0, 12) === token
}

interface ArticleRow extends Record<string, unknown> {
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
  published_at: string
  created_at: string
  author_name: string | null
  author_avatar: string | null
  blog_slug: string | null
  password_hash: string | null
}

interface SeriesArticleRow extends Record<string, unknown> {
  id: string
  title: string
  slug: string
  series_order: number | null
  is_public: boolean
  published_at: string
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

  // 私人文章：允許作者本人或持有有效 preview_token 的請求
  if (!article.is_public) {
    const previewToken = req.nextUrl.searchParams.get('preview_token')
    if (previewToken) {
      const valid = await verifyPreviewToken(article.id, previewToken)
      if (!valid) return NextResponse.json({ error: '無效的預覽 token' }, { status: 403 })
    } else {
      const ctx = await getTenantContext()
      if (ctx.userId !== article.user_id) {
        return NextResponse.json({ error: '此文章為私人' }, { status: 403 })
      }
    }
  }

  // 密碼保護：檢查 unlock cookie
  if (article.password_hash) {
    const noTrack = req.nextUrl.searchParams.get('notrack') === '1'
    const unlockCookie = req.cookies.get(`article_unlock_${article.id}`)?.value
    if (!noTrack && unlockCookie !== '1') {
      // 不回傳內容，只回傳基本資訊讓前端顯示密碼輸入
      const { password_hash: _ph, content: _c, ...publicInfo } = article
      return NextResponse.json({
        article: { ...publicInfo, content: '', is_password_protected: true },
        is_password_protected: true,
        prev: null,
        next: null,
        series: null,
      })
    }
  }

  // 增加瀏覽次數（notrack=1 時跳過，用於 generateMetadata 呼叫避免重複計算）
  const noTrack = req.nextUrl.searchParams.get('notrack') === '1'
  if (!noTrack) {
    execute(
      `UPDATE user_blog_articles SET view_count = view_count + 1 WHERE id = $1`,
      [article.id]
    ).catch(() => {})
  }

  // 上一篇 / 下一篇（同作者的公開文章） + 系列文章列表（如果有）
  interface NavRow extends Record<string, unknown> { title: string; slug: string }
  const queries: [
    Promise<NavRow[]>,
    Promise<NavRow[]>,
    Promise<{ id: string; title: string; is_completed: boolean } | null>,
    Promise<SeriesArticleRow[]>,
  ] = [
    query<NavRow>(
      `SELECT title, slug FROM user_blog_articles
       WHERE user_id::text = $1 AND is_public = true AND published_at < $2
       ORDER BY published_at DESC LIMIT 1`,
      [ownerRow.user_id, article.published_at]
    ),
    query<NavRow>(
      `SELECT title, slug FROM user_blog_articles
       WHERE user_id::text = $1 AND is_public = true AND published_at > $2
       ORDER BY published_at ASC LIMIT 1`,
      [ownerRow.user_id, article.published_at]
    ),
    article.series_id
      ? queryOne<{ id: string; title: string; is_completed: boolean }>(
          `SELECT id, title, is_completed FROM blog_series WHERE id = $1`,
          [article.series_id]
        )
      : Promise.resolve(null),
    article.series_id
      ? query<SeriesArticleRow>(
          `SELECT id, title, slug, series_order, is_public, published_at
           FROM user_blog_articles
           WHERE series_id = $1 AND is_public = true
           ORDER BY series_order ASC NULLS LAST, published_at ASC`,
          [article.series_id]
        )
      : Promise.resolve([]),
  ]

  const [prevRows, nextRows, seriesInfo, seriesArticles] = await Promise.all(queries)

  return NextResponse.json({
    article,
    prev: prevRows[0] ?? null,
    next: nextRows[0] ?? null,
    series: seriesInfo ? { ...seriesInfo, articles: seriesArticles } : null,
  })
}

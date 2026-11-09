import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { pushToUser } from '@/lib/lineNotify'
import { verifyToken } from '@/lib/jwt'

interface CommentRow extends Record<string, unknown> {
  id: string
  author_name: string
  author_avatar: string | null
  user_id: string | null
  content: string
  created_at: string
  like_count: number
  parent_id: string | null
}

interface ArticleContext {
  articleId: string
  userId: string
}

async function getArticleContext(userSlug: string, articleSlug: string): Promise<ArticleContext | null> {
  const owner = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_blog_settings WHERE blog_slug = $1`,
    [userSlug]
  ) ?? await queryOne<{ user_id: string }>(
    `SELECT id AS user_id FROM admin_users WHERE id::text = $1`,
    [userSlug]
  )
  if (!owner) return null

  const article = await queryOne<{ id: string }>(
    `SELECT id FROM user_blog_articles WHERE user_id::text = $1 AND slug = $2 AND is_public = true`,
    [owner.user_id, articleSlug]
  )
  if (!article) return null

  return { articleId: article.id, userId: owner.user_id }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params
  const ctx = await getArticleContext(userSlug, articleSlug)
  if (!ctx) return NextResponse.json({ comments: [] })

  try {
    const rows = await query<CommentRow>(
      `SELECT bc.id, bc.author_name, bc.author_avatar, bc.user_id::text,
              bc.content, bc.created_at, COALESCE(bc.like_count, 0) AS like_count,
              CASE WHEN bc.parent_id IS NULL THEN NULL ELSE bc.parent_id::text END AS parent_id
       FROM blog_comments bc
       WHERE bc.article_id = $1 AND bc.is_approved = true
       ORDER BY bc.created_at ASC`,
      [ctx.articleId]
    )
    // Build tree: top-level + replies grouped by parent
    const topLevel: (CommentRow & { replies: CommentRow[] })[] = []
    const replyMap = new Map<string, CommentRow[]>()

    for (const r of rows) {
      if (r.parent_id) {
        const arr = replyMap.get(r.parent_id) ?? []
        arr.push(r)
        replyMap.set(r.parent_id, arr)
      } else {
        topLevel.push({ ...r, replies: [] })
      }
    }
    for (const c of topLevel) {
      c.replies = replyMap.get(c.id) ?? []
    }

    return NextResponse.json({ comments: topLevel })
  } catch {
    return NextResponse.json({ comments: [] })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params
  const ctx = await getArticleContext(userSlug, articleSlug)
  if (!ctx) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

  const body = await req.json() as { author_name?: string; content?: string; parent_id?: string }
  const content = (body.content ?? '').trim()

  if (!content || content.length > 1000) {
    return NextResponse.json({ error: '留言內容不得為空或超過 1000 字' }, { status: 400 })
  }

  // 嘗試從 session 取得登入用戶（可選）
  const sessionToken = req.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken).catch(() => null) : null
  let authorName = (body.author_name ?? '').trim() || '匿名訪客'
  let authorAvatar: string | null = null
  let userId: string | null = null

  if (auth?.sub) {
    userId = auth.sub
    const profile = await queryOne<{ display_name: string | null; avatar_url: string | null }>(
      `SELECT COALESCE(up.display_name, au.display_name, au.username) AS display_name,
              COALESCE(up.avatar_url, au.avatar_url) AS avatar_url
       FROM admin_users au
       LEFT JOIN user_profiles up ON up.user_id = au.id
       WHERE au.id = $1`,
      [userId]
    )
    if (profile?.display_name) authorName = profile.display_name
    authorAvatar = profile?.avatar_url ?? null
  }

  const parentId = body.parent_id || null

  try {
    const row = await queryOne<CommentRow>(
      `INSERT INTO blog_comments (article_id, author_name, author_avatar, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, author_name, author_avatar, user_id::text, content, created_at,
                 COALESCE(like_count, 0) AS like_count,
                 CASE WHEN parent_id IS NULL THEN NULL ELSE parent_id::text END AS parent_id`,
      [ctx.articleId, authorName, authorAvatar, userId, content, parentId]
    )

    // Notify blog author via LINE (non-blocking)
    after(() => notifyAuthorNewComment(ctx.userId, authorName, content, articleSlug).catch(() => {}))

    return NextResponse.json({ comment: row })
  } catch {
    return NextResponse.json({ error: '留言功能暫時無法使用' }, { status: 500 })
  }
}

async function notifyAuthorNewComment(userId: string, commenterName: string, content: string, articleSlug: string): Promise<void> {
  const author = await queryOne<{ line_id: string | null }>(
    `SELECT line_id FROM admin_users WHERE id::text = $1`,
    [userId]
  )
  if (!author?.line_id) return

  const preview = content.length > 60 ? content.slice(0, 60) + '...' : content
  await pushToUser(
    author.line_id,
    `💬 你的部落格文章收到了新留言！\n\n${commenterName}：${preview}`
  )
}


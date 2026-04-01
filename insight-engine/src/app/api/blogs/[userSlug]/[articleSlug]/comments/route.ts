import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { pushToUser } from '@/lib/lineNotify'

interface CommentRow extends Record<string, unknown> {
  id: string
  author_name: string
  content: string
  created_at: string
  like_count: number
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
    const comments = await query<CommentRow>(
      `SELECT id, author_name, content, created_at, COALESCE(like_count, 0) AS like_count
       FROM blog_comments
       WHERE article_id = $1 AND is_approved = true
       ORDER BY created_at ASC`,
      [ctx.articleId]
    )
    return NextResponse.json({ comments })
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

  const body = await req.json() as { author_name?: string; content?: string }
  const authorName = (body.author_name ?? '').trim() || '匿名訪客'
  const content = (body.content ?? '').trim()

  if (!content || content.length > 1000) {
    return NextResponse.json({ error: '留言內容不得為空或超過 1000 字' }, { status: 400 })
  }

  try {
    const row = await queryOne<{ id: string; author_name: string; content: string; created_at: string; like_count: number }>(
      `INSERT INTO blog_comments (article_id, author_name, content)
       VALUES ($1, $2, $3) RETURNING id, author_name, content, created_at, COALESCE(like_count, 0) AS like_count`,
      [ctx.articleId, authorName, content]
    )

    // Notify blog author via LINE (non-blocking)
    notifyAuthorNewComment(ctx.userId, authorName, content, articleSlug).catch(() => {})

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


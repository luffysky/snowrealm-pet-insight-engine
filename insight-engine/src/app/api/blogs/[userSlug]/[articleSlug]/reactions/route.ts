import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'

const ALLOWED_EMOJIS = ['❤️', '🔥', '👏', '😮', '😂', '🎉']

async function getArticleId(userSlug: string, articleSlug: string): Promise<string | null> {
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
  return article?.id ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params
  const articleId = await getArticleId(userSlug, articleSlug)
  if (!articleId) return NextResponse.json({ reactions: {} })

  try {
    interface CountRow extends Record<string, unknown> { emoji: string; count: string }
    const rows = await query<CountRow>(
      `SELECT emoji, COUNT(*) AS count FROM blog_reactions WHERE article_id = $1 GROUP BY emoji`,
      [articleId]
    )
    const reactions: Record<string, number> = {}
    rows.forEach(r => { reactions[r.emoji] = parseInt(r.count) })
    return NextResponse.json({ reactions })
  } catch {
    return NextResponse.json({ reactions: {} })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params
  const articleId = await getArticleId(userSlug, articleSlug)
  if (!articleId) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

  const body = await req.json() as { emoji?: string; fingerprint?: string }
  const emoji = body.emoji ?? '❤️'
  const fp = (body.fingerprint ?? '').slice(0, 64)

  if (!ALLOWED_EMOJIS.includes(emoji) || !fp) {
    return NextResponse.json({ error: '無效請求' }, { status: 400 })
  }

  try {
    // Toggle: try insert, if exists delete
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM blog_reactions WHERE article_id = $1 AND fingerprint = $2 AND emoji = $3`,
      [articleId, fp, emoji]
    )
    if (existing) {
      await execute(`DELETE FROM blog_reactions WHERE id = $1`, [existing.id])
    } else {
      await execute(
        `INSERT INTO blog_reactions (article_id, fingerprint, emoji) VALUES ($1, $2, $3)`,
        [articleId, fp, emoji]
      )
    }

    interface CountRow extends Record<string, unknown> { emoji: string; count: string }
    const rows = await query<CountRow>(
      `SELECT emoji, COUNT(*) AS count FROM blog_reactions WHERE article_id = $1 GROUP BY emoji`,
      [articleId]
    )
    const reactions: Record<string, number> = {}
    rows.forEach(r => { reactions[r.emoji] = parseInt(r.count) })
    return NextResponse.json({ reactions, toggled: emoji, added: !existing })
  } catch {
    return NextResponse.json({ error: '無法處理' }, { status: 500 })
  }
}

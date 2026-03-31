import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, execute, queryOne } from '@/lib/db'

interface CommentAdminRow extends Record<string, unknown> {
  id: string
  article_id: string
  article_title: string
  article_slug: string
  author_name: string
  content: string
  is_approved: boolean
  created_at: string
}

/** GET /api/admin/social/blog/comments?status=pending|all
 *  列出當前用戶所有文章的留言
 */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') ?? 'all'

  const rows = await query<CommentAdminRow>(
    `SELECT
       bc.id, bc.article_id, bc.author_name, bc.content, bc.is_approved, bc.created_at,
       a.title AS article_title,
       a.slug AS article_slug
     FROM blog_comments bc
     JOIN user_blog_articles a ON a.id = bc.article_id
     WHERE a.user_id::text = $1
       AND ($2 = 'all' OR ($2 = 'pending' AND bc.is_approved = false))
     ORDER BY bc.created_at DESC
     LIMIT 200`,
    [ctx.userId, status]
  )

  return NextResponse.json({ comments: rows })
}

/** PATCH /api/admin/social/blog/comments
 *  body: { commentId: string, action: 'approve' | 'delete' }
 */
export async function PATCH(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { commentId?: string; action?: 'approve' | 'delete' }
  if (!body.commentId || !body.action) {
    return NextResponse.json({ error: '缺少 commentId 或 action' }, { status: 400 })
  }

  // 確認留言屬於當前用戶的文章
  const ownership = await queryOne<{ id: string }>(
    `SELECT bc.id FROM blog_comments bc
     JOIN user_blog_articles a ON a.id = bc.article_id
     WHERE bc.id = $1 AND a.user_id::text = $2`,
    [body.commentId, ctx.userId]
  )
  if (!ownership) return NextResponse.json({ error: '找不到留言或無權限' }, { status: 404 })

  if (body.action === 'approve') {
    await execute(
      `UPDATE blog_comments SET is_approved = true WHERE id = $1`,
      [body.commentId]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'delete') {
    await execute(`DELETE FROM blog_comments WHERE id = $1`, [body.commentId])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '無效的 action' }, { status: 400 })
}

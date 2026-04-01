import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

/**
 * POST /api/blogs/[userSlug]/[articleSlug]/unlock
 * 驗證密碼後設定 HttpOnly cookie，頁面重載後即可查看完整文章
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string; articleSlug: string }> }
) {
  const { userSlug, articleSlug } = await params

  const body = await req.json() as { password?: string }
  if (!body.password) {
    return NextResponse.json({ error: '請輸入密碼' }, { status: 400 })
  }

  // 解析 user_id
  const ownerRow = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_blog_settings WHERE blog_slug = $1`,
    [userSlug]
  ) ?? await queryOne<{ user_id: string }>(
    `SELECT id AS user_id FROM admin_users WHERE id::text = $1`,
    [userSlug]
  )

  if (!ownerRow) return NextResponse.json({ error: '找不到部落格' }, { status: 404 })

  const article = await queryOne<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM user_blog_articles
     WHERE user_id::text = $1 AND slug = $2`,
    [ownerRow.user_id, articleSlug]
  )

  if (!article) return NextResponse.json({ error: '找不到文章' }, { status: 404 })

  if (!article.password_hash) {
    return NextResponse.json({ error: '此文章不需要密碼' }, { status: 400 })
  }

  const valid = await verifyPassword(body.password, article.password_hash)
  if (!valid) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
  }

  // 密碼正確 → 設定 HttpOnly unlock cookie（24 小時有效）
  const response = NextResponse.json({ ok: true })
  response.cookies.set(`article_unlock_${article.id}`, '1', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 86400,
  })
  return response
}

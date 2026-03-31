import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

/** POST /api/blogs/[userSlug]/subscribe — 訂閱部落格更新 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  const { userSlug } = await params

  const blog = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_blog_settings WHERE blog_slug = $1 AND is_enabled = true`,
    [userSlug]
  )
  if (!blog) return NextResponse.json({ error: '找不到部落格' }, { status: 404 })

  const body = await req.json() as { email?: string; name?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  const name = (body.name ?? '').trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '請輸入有效的電子郵件' }, { status: 400 })
  }

  try {
    await execute(
      `INSERT INTO blog_subscribers (blog_user_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (blog_user_id, email) DO UPDATE SET name = EXCLUDED.name`,
      [blog.user_id, email, name]
    )
  } catch {
    return NextResponse.json({ error: '訂閱失敗，請稍後再試' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

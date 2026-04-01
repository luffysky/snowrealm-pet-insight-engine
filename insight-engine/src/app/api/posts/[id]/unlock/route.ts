import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

/**
 * POST /api/posts/[id]/unlock
 * 驗證密碼後設定 HttpOnly cookie，讓前端重載後可查看內容
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json() as { password?: string }

  if (!body.password) {
    return NextResponse.json({ error: '請輸入密碼' }, { status: 400 })
  }

  const post = await queryOne<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM social_posts WHERE id = $1`,
    [id]
  )

  if (!post) return NextResponse.json({ error: '找不到貼文' }, { status: 404 })
  if (!post.password_hash) return NextResponse.json({ error: '此貼文不需要密碼' }, { status: 400 })

  const valid = await verifyPassword(body.password, post.password_hash)
  if (!valid) return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`post_unlock_${post.id}`, '1', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 86400,
  })
  return response
}

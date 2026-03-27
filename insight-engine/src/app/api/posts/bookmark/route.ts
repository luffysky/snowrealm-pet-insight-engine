import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { execute, queryOne } from '@/lib/db'

async function getAuth(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  return token ? await verifyToken(token) : null
}

/** GET /api/posts/bookmark?postId=xxx — check if bookmarked */
export async function GET(request: NextRequest) {
  const auth = await getAuth(request)
  if (!auth) return NextResponse.json({ isBookmarked: false })

  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) return NextResponse.json({ isBookmarked: false })

  const row = await queryOne<{ id: string }>(
    `SELECT id FROM social_bookmarks WHERE user_id = $1 AND post_id = $2`,
    [auth.sub, postId]
  )
  return NextResponse.json({ isBookmarked: !!row })
}

/** POST /api/posts/bookmark — toggle bookmark */
export async function POST(request: NextRequest) {
  const auth = await getAuth(request)
  if (!auth) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const { postId } = await request.json() as { postId: string }
  if (!postId) return NextResponse.json({ error: '缺少 postId' }, { status: 400 })

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM social_bookmarks WHERE user_id = $1 AND post_id = $2`,
    [auth.sub, postId]
  )

  if (existing) {
    await execute(`DELETE FROM social_bookmarks WHERE user_id = $1 AND post_id = $2`, [auth.sub, postId])
    return NextResponse.json({ isBookmarked: false })
  } else {
    await execute(
      `INSERT INTO social_bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [auth.sub, postId]
    )
    return NextResponse.json({ isBookmarked: true })
  }
}

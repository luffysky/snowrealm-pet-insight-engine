import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, execute, queryOne } from '@/lib/db'

interface BookmarkRow extends Record<string, unknown> {
  id: string
  user_id: string
  post_id: string
  created_at: string
  title: string | null
  content: string
  type: string
  images: string | null
  tags: string[] | null
  post_user_id: string
  author_name: string | null
  author_avatar: string | null
  likes_count: number
  comments_count: number
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')

  if (postId) {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM social_bookmarks WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    )
    return NextResponse.json({ isBookmarked: !!row })
  }

  const rows = await query<BookmarkRow>(
    `SELECT sb.id, sb.user_id, sb.post_id, sb.created_at,
       sp.title, sp.content, sp.type, sp.images, sp.tags,
       sp.user_id as post_user_id, sp.likes_count, sp.comments_count,
       au.display_name as author_name, au.avatar_url as author_avatar
     FROM social_bookmarks sb
     JOIN social_posts sp ON sp.id = sb.post_id
     JOIN admin_users au ON au.id = sp.user_id
     WHERE sb.user_id = $1
     ORDER BY sb.created_at DESC`,
    [userId]
  )

  const bookmarks = rows.map(r => ({
    id: r.id,
    postId: r.post_id,
    createdAt: r.created_at,
    post: {
      id: r.post_id,
      type: r.type,
      title: r.title,
      content: r.content,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images ?? []),
      tags: r.tags ?? [],
      userId: r.post_user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      likesCount: r.likes_count,
      commentsCount: r.comments_count,
    },
  }))

  return NextResponse.json({ bookmarks })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const { postId } = await req.json() as { postId: string }
  if (!postId) return NextResponse.json({ error: '缺少 postId' }, { status: 400 })

  try {
    await execute(
      `INSERT INTO social_bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, postId]
    )
    return NextResponse.json({ ok: true, isBookmarked: true })
  } catch {
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const { postId } = await req.json() as { postId: string }
  if (!postId) return NextResponse.json({ error: '缺少 postId' }, { status: 400 })

  await execute(
    `DELETE FROM social_bookmarks WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  )
  return NextResponse.json({ ok: true, isBookmarked: false })
}

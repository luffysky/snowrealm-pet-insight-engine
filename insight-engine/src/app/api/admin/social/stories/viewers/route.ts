import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { query, queryOne } from '@/lib/db'

interface ViewerRow extends Record<string, unknown> {
  viewer_id: string
  viewer_name: string
  viewer_avatar: string | null
  viewed_at: string
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string }
}

/** GET /api/admin/social/stories/viewers?storyId=<id> — 取得觀看者列表（僅作者可用）*/
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const storyId = req.nextUrl.searchParams.get('storyId')
  if (!storyId) return NextResponse.json({ error: '缺少 storyId' }, { status: 400 })

  // 確認是作者
  const story = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM stories WHERE id = $1`, [storyId]
  )
  if (!story || story.user_id !== auth.userId) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const viewers = await query<ViewerRow>(
    `SELECT sv.viewer_id, u.display_name AS viewer_name, u.avatar_url AS viewer_avatar, sv.viewed_at
     FROM story_views sv
     JOIN admin_users u ON u.id = sv.viewer_id
     WHERE sv.story_id = $1
     ORDER BY sv.viewed_at DESC`,
    [storyId]
  )

  return NextResponse.json({
    viewers: viewers.map(v => ({
      userId: v.viewer_id,
      name: v.viewer_name,
      avatar: v.viewer_avatar,
      viewedAt: v.viewed_at,
    }))
  })
}

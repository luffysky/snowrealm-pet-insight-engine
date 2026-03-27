import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { query, queryOne, execute } from '@/lib/db'

interface StoryRow extends Record<string, unknown> {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  canvas: Record<string, unknown>
  visibility: string
  expires_at: string
  is_highlight: boolean
  view_count: number
  created_at: string
  has_viewed: boolean
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string, tenantId: (payload.tid as string) || 'default' }
}

/** GET /api/admin/social/stories?userId=<id> — 取得某用戶的動態列表（或 feed） */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  const targetUserId = req.nextUrl.searchParams.get('userId')
  const feed = req.nextUrl.searchParams.get('feed') === '1'

  if (feed) {
    // Feed：取得所有人的有效動態，按用戶分組（社群頁頂部圓圈列）
    const rows = await query<StoryRow>(
      `SELECT DISTINCT ON (s.user_id)
         s.id, s.user_id, u.display_name AS user_name, u.avatar_url AS user_avatar,
         s.canvas, s.visibility, s.expires_at, s.is_highlight, s.view_count, s.created_at,
         EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1) AS has_viewed
       FROM stories s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.is_active = true
         AND (s.expires_at > NOW() OR s.is_highlight = true)
         AND s.visibility = 'public'
       ORDER BY s.user_id, s.created_at DESC`,
      [auth?.userId ?? '00000000-0000-0000-0000-000000000000']
    )
    return NextResponse.json({ stories: rows.map(formatStory) })
  }

  if (targetUserId) {
    const rows = await query<StoryRow>(
      `SELECT s.id, s.user_id, u.display_name AS user_name, u.avatar_url AS user_avatar,
              s.canvas, s.visibility, s.expires_at, s.is_highlight, s.view_count, s.created_at,
              EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $2) AS has_viewed
       FROM stories s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.user_id = $1
         AND s.is_active = true
         AND (s.expires_at > NOW() OR s.is_highlight = true)
       ORDER BY s.created_at DESC`,
      [targetUserId, auth?.userId ?? '00000000-0000-0000-0000-000000000000']
    )
    return NextResponse.json({ stories: rows.map(formatStory) })
  }

  return NextResponse.json({ error: '缺少參數' }, { status: 400 })
}

/** POST /api/admin/social/stories — 發布動態 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    canvas: Record<string, unknown>
    visibility?: string
    expiresHours?: number   // 24 | 72 | 0 (永久)
    isHighlight?: boolean
  }

  if (!body.canvas) return NextResponse.json({ error: '缺少 canvas 資料' }, { status: 400 })

  const expiresHours = body.expiresHours ?? 24
  const expiresAt = expiresHours === 0
    ? new Date('2099-12-31').toISOString()
    : new Date(Date.now() + expiresHours * 3600000).toISOString()

  const story = await queryOne<{ id: string }>(
    `INSERT INTO stories (user_id, tenant_id, canvas, visibility, expires_at, is_highlight)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [auth.userId, auth.tenantId, JSON.stringify(body.canvas),
     body.visibility ?? 'public', expiresAt, body.isHighlight ?? false]
  )

  return NextResponse.json({ storyId: story?.id })
}

/** DELETE /api/admin/social/stories?id=<id> — 刪除自己的動態 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const count = await execute(
    `UPDATE stories SET is_active = false WHERE id = $1 AND user_id = $2`,
    [id, auth.userId]
  )

  if (count === 0) return NextResponse.json({ error: '找不到或無權限' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

function formatStory(r: StoryRow) {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userAvatar: r.user_avatar,
    canvas: r.canvas,
    visibility: r.visibility,
    expiresAt: r.expires_at,
    isHighlight: r.is_highlight,
    viewCount: r.view_count,
    createdAt: r.created_at,
    hasViewed: r.has_viewed,
  }
}

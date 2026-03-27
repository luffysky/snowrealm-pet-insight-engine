import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { query, queryOne, execute } from '@/lib/db'

interface AlbumPhoto extends Record<string, unknown> {
  id: string
  user_id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string, tenantId: (payload.tid as string) || 'default' }
}

/** GET /api/admin/social/album?userId=<id> */
export async function GET(req: NextRequest) {
  const targetUserId = req.nextUrl.searchParams.get('userId')
  if (!targetUserId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

  const auth = await getAuth()
  const isOwner = auth?.userId === targetUserId

  const photos = await query<AlbumPhoto>(
    isOwner
      ? `SELECT id, user_id, url, caption, is_public, display_order, created_at
         FROM user_album_photos WHERE user_id = $1 ORDER BY display_order ASC, created_at DESC`
      : `SELECT id, user_id, url, caption, is_public, display_order, created_at
         FROM user_album_photos WHERE user_id = $1 AND is_public = true ORDER BY display_order ASC, created_at DESC`,
    [targetUserId]
  )

  return NextResponse.json({ photos })
}

/** POST /api/admin/social/album — 新增照片 */
export async function POST(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { url: string; caption?: string; isPublic?: boolean }
  if (!body.url) return NextResponse.json({ error: '缺少圖片 URL' }, { status: 400 })

  const photo = await queryOne<AlbumPhoto>(
    `INSERT INTO user_album_photos (user_id, tenant_id, url, caption, is_public)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, url, caption, is_public, display_order, created_at`,
    [auth.userId, auth.tenantId, body.url, body.caption ?? null, body.isPublic ?? true]
  )

  return NextResponse.json({ photo })
}

/** PATCH /api/admin/social/album/[id] handled below as query param */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { id: string; caption?: string; isPublic?: boolean }
  if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const photo = await queryOne<AlbumPhoto>(
    `UPDATE user_album_photos SET
       caption = COALESCE($1, caption),
       is_public = COALESCE($2, is_public)
     WHERE id = $3 AND user_id = $4
     RETURNING id, url, caption, is_public`,
    [body.caption ?? null, body.isPublic ?? null, body.id, auth.userId]
  )

  if (!photo) return NextResponse.json({ error: '找不到照片或無權限' }, { status: 404 })
  return NextResponse.json({ photo })
}

/** DELETE /api/admin/social/album?id=<id> */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const count = await execute(
    `DELETE FROM user_album_photos WHERE id = $1 AND user_id = $2`,
    [id, auth.userId]
  )

  if (count === 0) return NextResponse.json({ error: '找不到照片或無權限' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

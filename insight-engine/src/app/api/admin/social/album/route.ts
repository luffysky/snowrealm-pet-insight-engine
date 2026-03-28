import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { query, queryOne, execute } from '@/lib/db'

interface AlbumPhoto extends Record<string, unknown> {
  id: string
  user_id: string
  album_id: string | null
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

/** GET /api/admin/social/album?userId=<id>&albumId=<id> */
export async function GET(req: NextRequest) {
  const targetUserId = req.nextUrl.searchParams.get('userId')
  const albumId = req.nextUrl.searchParams.get('albumId')
  if (!targetUserId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

  const auth = await getAuth()
  const isOwner = auth?.userId === targetUserId

  const params: (string | null)[] = [targetUserId]
  let albumFilter = ''
  if (albumId) {
    params.push(albumId)
    albumFilter = `AND album_id = $${params.length}`
  }

  const photos = await query<AlbumPhoto>(
    isOwner
      ? `SELECT id, user_id, album_id, url, caption, is_public, display_order, created_at
         FROM user_album_photos WHERE user_id = $1 ${albumFilter}
         ORDER BY display_order ASC, created_at DESC`
      : `SELECT id, user_id, album_id, url, caption, is_public, display_order, created_at
         FROM user_album_photos WHERE user_id = $1 AND is_public = true ${albumFilter}
         ORDER BY display_order ASC, created_at DESC`,
    params
  )

  return NextResponse.json({ photos })
}

/** POST /api/admin/social/album — 新增照片 */
export async function POST(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { url: string; caption?: string; isPublic?: boolean; albumId?: string }
  if (!body.url) return NextResponse.json({ error: '缺少圖片 URL' }, { status: 400 })

  // 驗證 albumId 屬於當前用戶
  if (body.albumId) {
    const album = await queryOne<{ id: string }>(
      `SELECT id FROM user_albums WHERE id = $1 AND user_id = $2`,
      [body.albumId, auth.userId]
    )
    if (!album) return NextResponse.json({ error: '相簿不存在' }, { status: 404 })
  }

  const photo = await queryOne<AlbumPhoto>(
    `INSERT INTO user_album_photos (user_id, tenant_id, url, caption, is_public, album_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, album_id, url, caption, is_public, display_order, created_at`,
    [auth.userId, auth.tenantId, body.url, body.caption ?? null, body.isPublic ?? true, body.albumId ?? null]
  )

  return NextResponse.json({ photo })
}

/** PATCH — 更新單張或批量設定 is_public */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    id?: string
    ids?: string[]
    caption?: string
    isPublic?: boolean
    albumId?: string | null
    reorder?: { id: string; displayOrder: number }[]
  }

  // 批量排序
  if (body.reorder) {
    await Promise.all(body.reorder.map(item =>
      execute(
        `UPDATE user_album_photos SET display_order = $1 WHERE id = $2 AND user_id = $3`,
        [item.displayOrder, item.id, auth.userId]
      )
    ))
    return NextResponse.json({ ok: true })
  }

  // 批量移動到相簿
  if (body.ids && body.albumId !== undefined) {
    await execute(
      `UPDATE user_album_photos SET album_id = $1 WHERE id = ANY($2::uuid[]) AND user_id = $3`,
      [body.albumId ?? null, body.ids, auth.userId]
    )
    return NextResponse.json({ ok: true })
  }

  // 批量設定公開/私人
  if (body.ids && typeof body.isPublic === 'boolean') {
    await execute(
      `UPDATE user_album_photos SET is_public = $1 WHERE id = ANY($2::uuid[]) AND user_id = $3`,
      [body.isPublic, body.ids, auth.userId]
    )
    return NextResponse.json({ ok: true })
  }

  // 更新單張
  if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const photo = await queryOne<AlbumPhoto>(
    `UPDATE user_album_photos SET
       caption = COALESCE($1, caption),
       is_public = COALESCE($2, is_public),
       album_id = CASE WHEN $3::boolean THEN $4::uuid ELSE album_id END
     WHERE id = $5 AND user_id = $6
     RETURNING id, url, caption, is_public, album_id`,
    [
      body.caption ?? null,
      body.isPublic ?? null,
      body.albumId !== undefined,
      body.albumId ?? null,
      body.id,
      auth.userId,
    ]
  )

  if (!photo) return NextResponse.json({ error: '找不到照片或無權限' }, { status: 404 })
  return NextResponse.json({ photo })
}

/** DELETE — 刪除單張或批量刪除 */
export async function DELETE(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const ids = req.nextUrl.searchParams.get('ids')

  if (ids) {
    const idList = ids.split(',').filter(Boolean)
    await execute(
      `DELETE FROM user_album_photos WHERE id = ANY($1::uuid[]) AND user_id = $2`,
      [idList, auth.userId]
    )
    return NextResponse.json({ ok: true })
  }

  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  const count = await execute(
    `DELETE FROM user_album_photos WHERE id = $1 AND user_id = $2`,
    [id, auth.userId]
  )
  if (count === 0) return NextResponse.json({ error: '找不到照片或無權限' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

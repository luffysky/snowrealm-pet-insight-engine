import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { query, queryOne, execute } from '@/lib/db'

interface AlbumRow extends Record<string, unknown> {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  display_order: number
  created_at: string
  photo_count: string
  cover_url: string | null
}

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext()
  const targetUserId = req.nextUrl.searchParams.get('userId')
  if (!targetUserId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

  const isOwner = ctx.userId === targetUserId

  const albums = await query<AlbumRow>(
    `SELECT a.*,
       COUNT(p.id)::text AS photo_count,
       (SELECT url FROM user_album_photos WHERE album_id = a.id ORDER BY display_order ASC, created_at DESC LIMIT 1) AS cover_url
     FROM user_albums a
     LEFT JOIN user_album_photos p ON p.album_id = a.id ${isOwner ? '' : 'AND p.is_public = true'}
     WHERE a.user_id = $1 ${isOwner ? '' : 'AND a.is_public = true'}
     GROUP BY a.id
     ORDER BY a.display_order ASC, a.created_at DESC`,
    [targetUserId]
  )

  return NextResponse.json({ albums: albums.map(a => ({
    id: a.id,
    userId: a.user_id,
    name: a.name,
    description: a.description,
    isPublic: a.is_public,
    displayOrder: a.display_order,
    photoCount: parseInt(a.photo_count, 10),
    coverUrl: a.cover_url,
    createdAt: a.created_at,
  })) })
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { name?: string; description?: string; isPublic?: boolean }
  const name = body.name?.trim() || '新相簿'

  const album = await queryOne<AlbumRow>(
    `INSERT INTO user_albums (user_id, tenant_id, name, description, is_public)
     VALUES ($1, $2, $3, $4, $5) RETURNING *,
     0::text AS photo_count, NULL AS cover_url`,
    [ctx.userId, ctx.tenantId ?? 'default', name, body.description ?? null, body.isPublic ?? true]
  )

  return NextResponse.json({ album: {
    id: album!.id,
    name: album!.name,
    description: album!.description,
    isPublic: album!.is_public,
    photoCount: 0,
    coverUrl: null,
    createdAt: album!.created_at,
  } })
}

export async function PATCH(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as { id: string; name?: string; description?: string; isPublic?: boolean }
  if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const album = await queryOne<{ id: string; name: string; is_public: boolean }>(
    `UPDATE user_albums SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       is_public = COALESCE($3, is_public),
       updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING id, name, is_public`,
    [body.name ?? null, body.description ?? null, body.isPublic ?? null, body.id, ctx.userId]
  )

  if (!album) return NextResponse.json({ error: '找不到相簿' }, { status: 404 })
  return NextResponse.json({ album })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const count = await execute(
    `DELETE FROM user_albums WHERE id = $1 AND user_id = $2`,
    [id, ctx.userId]
  )

  if (count === 0) return NextResponse.json({ error: '找不到相簿' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

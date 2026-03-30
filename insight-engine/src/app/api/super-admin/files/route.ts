import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * 20

  const typeFilter = type === 'all' ? 'all' : type
  const statusFilter = status === 'all' ? 'all' : status

  try {
    // 用戶上傳的相片（相簿） + 管理員上傳的媒體資源（media_assets）
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::TEXT AS total FROM (
         SELECT id FROM user_album_photos
         WHERE ($1 = 'all' OR $1 = 'image')
         UNION ALL
         SELECT id FROM media_assets
         WHERE ($1 = 'all' OR mime_type LIKE $1 || '%')
       ) AS combined`,
      [typeFilter]
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query(
      `SELECT
         uap.id,
         uap.user_id::text AS user_id,
         uap.url AS file_path,
         'image' AS file_type,
         NULL AS file_size,
         'approved' AS ai_moderation_status,
         uap.created_at,
         up.nickname,
         up.display_name
       FROM user_album_photos uap
       LEFT JOIN user_profiles up ON up.user_id = uap.user_id
       WHERE ($1 = 'all' OR $1 = 'image')
         AND ($2 = 'all' OR $2 = 'approved')
       UNION ALL
       SELECT
         ma.id,
         ma.uploaded_by::text AS user_id,
         ma.url AS file_path,
         split_part(ma.mime_type, '/', 1) AS file_type,
         ma.size_bytes AS file_size,
         'approved' AS ai_moderation_status,
         ma.created_at,
         NULL AS nickname,
         NULL AS display_name
       FROM media_assets ma
       WHERE ($1 = 'all' OR ma.mime_type LIKE $1 || '%')
         AND ($2 = 'all' OR $2 = 'approved')
       ORDER BY created_at DESC
       LIMIT 20 OFFSET $3`,
      [typeFilter, statusFilter, offset]
    )

    return NextResponse.json({ files: rows, total })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ files: [], total: 0 })
    console.error('[files GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const { fileId } = await request.json() as { fileId: string }
    if (!fileId) return NextResponse.json({ error: '缺少 fileId' }, { status: 400 })

    // 嘗試從 user_album_photos 刪除，若不存在再試 media_assets
    const deleted1 = await queryOne<{ id: string }>(
      `DELETE FROM user_album_photos WHERE id = $1 RETURNING id`, [fileId]
    ).catch(() => null)
    if (!deleted1) {
      await execute(`DELETE FROM media_assets WHERE id = $1`, [fileId])
    }

    try {
      await execute(
        `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(auth.sub ?? ''),
          String(auth.name ?? ''),
          'file.delete',
          'user_files',
          fileId,
          JSON.stringify({}),
        ]
      )
    } catch {
      // non-fatal
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ error: '資料表不存在' }, { status: 404 })
    console.error('[files DELETE]', err)
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}

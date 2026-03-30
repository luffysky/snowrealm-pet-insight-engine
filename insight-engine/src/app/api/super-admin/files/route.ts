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
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::TEXT AS total FROM file_metadata fm
       WHERE ($1 = 'all' OR fm.file_type LIKE $1 || '%')
         AND ($2 = 'all' OR fm.ai_moderation_status = $2)`,
      [typeFilter, statusFilter]
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query(
      `SELECT fm.id, fm.user_id, fm.file_path, fm.file_type, fm.file_size,
              fm.ai_moderation_status, fm.created_at,
              up.nickname, up.display_name
       FROM file_metadata fm
       LEFT JOIN user_profiles up ON up.user_id = fm.user_id
       WHERE ($1 = 'all' OR fm.file_type LIKE $1 || '%')
         AND ($2 = 'all' OR fm.ai_moderation_status = $2)
       ORDER BY fm.created_at DESC
       LIMIT 20 OFFSET $3`,
      [typeFilter, statusFilter, offset]
    )

    return NextResponse.json({ data: rows, total })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [], total: 0 })
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

    await execute(`DELETE FROM file_metadata WHERE id = $1`, [fileId])

    try {
      await execute(
        `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(auth.sub ?? ''),
          String(auth.name ?? ''),
          'file.delete',
          'file_metadata',
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

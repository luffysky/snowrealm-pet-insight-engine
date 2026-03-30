import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
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
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const intent = searchParams.get('intent') ?? 'all'
  const model = searchParams.get('model') ?? 'all'
  const offset = (page - 1) * 20

  try {
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::TEXT AS total FROM guide_conversations gc
       WHERE ($1 = 'all' OR gc.intent_type = $1)
         AND ($2 = 'all' OR gc.model = $2)`,
      [intent, model]
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query(
      `SELECT gc.id, gc.user_id, gc.intent_type, gc.model, gc.message_count,
              gc.total_tokens, gc.created_at,
              up.nickname, up.display_name
       FROM guide_conversations gc
       LEFT JOIN user_profiles up ON up.user_id = gc.user_id
       WHERE ($1 = 'all' OR gc.intent_type = $1)
         AND ($2 = 'all' OR gc.model = $2)
       ORDER BY gc.created_at DESC
       LIMIT 20 OFFSET $3`,
      [intent, model, offset]
    )

    return NextResponse.json({ data: rows, total })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [], total: 0 })
    console.error('[conversations GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

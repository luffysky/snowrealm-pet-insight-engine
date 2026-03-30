import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
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

function isPgTableMissing(err: unknown): boolean {
  return (err as { code?: string })?.code === '42P01'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'pending'

  try {
    if (tab === 'reported') {
      try {
        const rows = await query(
          `SELECT * FROM user_reports WHERE status = 'open' ORDER BY created_at DESC LIMIT 100`
        )
        return NextResponse.json({ data: rows })
      } catch (err) {
        if (isPgTableMissing(err)) return NextResponse.json({ data: [] })
        throw err
      }
    }

    if (tab === 'resolved') {
      const rows = await query(
        `SELECT * FROM content_moderation_queue WHERE status != 'pending' ORDER BY reviewed_at DESC LIMIT 50`
      )
      return NextResponse.json({ data: rows })
    }

    // default: pending
    const rows = await query(
      `SELECT * FROM content_moderation_queue WHERE status = 'pending' ORDER BY created_at DESC`
    )
    return NextResponse.json({ data: rows })
  } catch (err) {
    if (isPgTableMissing(err)) return NextResponse.json({ data: [] })
    console.error('[moderation GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const { id, action, note } = await request.json() as {
      id: string
      action: 'pass' | 'delete' | 'warn' | 'ban' | 'dismiss'
      note?: string
    }
    if (!id || !action) return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })

    const statusMap: Record<string, string> = {
      pass: 'approved',
      delete: 'deleted',
      warn: 'warned',
      ban: 'banned',
      dismiss: 'dismissed',
    }
    const newStatus = statusMap[action] ?? 'dismissed'

    try {
      await execute(
        `UPDATE content_moderation_queue
         SET status = $1, reviewed_at = NOW(), reviewer_note = $2
         WHERE id = $3`,
        [newStatus, note ?? null, id]
      )
    } catch (err) {
      if (isPgTableMissing(err)) return NextResponse.json({ error: '資料表不存在' }, { status: 404 })
      throw err
    }

    try {
      await execute(
        `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(auth.sub ?? ''),
          String(auth.name ?? ''),
          `moderation.${action}`,
          'content_moderation_queue',
          id,
          JSON.stringify({ note }),
        ]
      )
    } catch {
      // audit log failure is non-fatal
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[moderation POST]', err)
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}

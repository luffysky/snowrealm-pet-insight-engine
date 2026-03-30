import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
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

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  try {
    const { from, to } = await request.json() as { from?: string; to?: string }

    const params: unknown[] = []
    const conditions: string[] = []
    let idx = 1

    if (from) {
      conditions.push(`created_at >= $${idx++}`)
      params.push(from)
    }
    if (to) {
      conditions.push(`created_at <= $${idx++}`)
      params.push(to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = await query<{
      id: string
      action: string
      actor_id: string
      target_type: string | null
      target_id: string | null
      details: unknown
      ip: string | null
      created_at: string
    }>(
      `SELECT id, action, actor_id, target_type, target_id, details, ip, created_at
       FROM audit_logs ${where} ORDER BY created_at DESC LIMIT 10000`,
      params
    )

    const header = 'id,action,user_id,target,details,ip,created_at\n'
    const csvRows = rows.map(r =>
      [
        escapeCsvField(r.id),
        escapeCsvField(r.action),
        escapeCsvField(r.actor_id),
        escapeCsvField(r.target_type && r.target_id ? `${r.target_type}:${r.target_id}` : (r.target_type ?? r.target_id ?? '')),
        escapeCsvField(r.details),
        escapeCsvField(r.ip),
        escapeCsvField(r.created_at),
      ].join(',')
    ).join('\n')

    const csv = header + csvRows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=audit-export.csv',
      },
    })
  } catch (err) {
    console.error('[audit/export POST]', err)
    return NextResponse.json({ error: '匯出失敗' }, { status: 500 })
  }
}

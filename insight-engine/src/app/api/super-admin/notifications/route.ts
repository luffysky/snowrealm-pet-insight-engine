import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants =
    payload.tenants || (payload.tid ? [{ tid: payload.tid, role: payload.role || 'admin' }] : [])
  const isSuper =
    tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

interface NotificationRow extends Record<string, unknown> {
  id: string
  title: string
  content: string
  category: string
  target: string
  channels: string[]
  status: string
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number
  read_count: number
  created_at: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  try {
    const rows = await query<NotificationRow>(
      `SELECT id, title, content, category, target, channels, status, scheduled_at, sent_at, sent_count, read_count, created_at
       FROM platform_notifications
       ORDER BY created_at DESC
       LIMIT 100`
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[super-admin/notifications GET] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  try {
    const body = await request.json()
    const {
      title,
      content,
      category = 'announcement',
      target = 'all',
      channels = ['line', 'dashboard'],
      scheduled_at,
      status = 'draft',
    } = body
    if (!title || !content) return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    const row = await queryOne<{ id: string } & Record<string, unknown>>(
      `INSERT INTO platform_notifications (id, title, content, category, target, channels, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [randomUUID(), title, content, category, target, channels, status, scheduled_at ?? null]
    )
    return NextResponse.json({ id: row?.id }, { status: 201 })
  } catch (error) {
    console.error('[super-admin/notifications POST] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


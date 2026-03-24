import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { id } = await params
  try {
    const body = await request.json()
    const { title, content, category, target, channels, status, scheduled_at } = body
    await execute(
      `UPDATE platform_notifications SET
         title = COALESCE($1, title),
         content = COALESCE($2, content),
         category = COALESCE($3, category),
         target = COALESCE($4, target),
         channels = COALESCE($5, channels),
         status = COALESCE($6, status),
         scheduled_at = COALESCE($7, scheduled_at),
         updated_at = NOW()
       WHERE id = $8`,
      [
        title ?? null,
        content ?? null,
        category ?? null,
        target ?? null,
        channels ?? null,
        status ?? null,
        scheduled_at ?? null,
        id,
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[super-admin/notifications PATCH] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { id } = await params
  try {
    await execute(
      `DELETE FROM platform_notifications WHERE id = $1 AND status = 'draft'`,
      [id]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[super-admin/notifications DELETE] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

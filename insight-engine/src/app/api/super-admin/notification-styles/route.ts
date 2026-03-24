import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
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

interface StyleRow extends Record<string, unknown> {
  event_type: string
  display_name: string
  is_active: boolean
  header_color: string
  header_text: string | null
  body_template: string
  footer_text: string | null
  button_label: string | null
  button_url: string | null
  text_template: string
  updated_at: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  try {
    const rows = await query<StyleRow>(
      `SELECT event_type, display_name, is_active, header_color, header_text, body_template,
              footer_text, button_label, button_url, text_template, updated_at
       FROM platform_notification_styles
       ORDER BY event_type`
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[super-admin/notification-styles GET] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  try {
    const body = await request.json()
    const {
      event_type,
      header_color,
      header_text,
      body_template,
      footer_text,
      button_label,
      button_url,
      text_template,
      is_active,
    } = body
    if (!event_type) return NextResponse.json({ error: '缺少 event_type' }, { status: 400 })
    await execute(
      `UPDATE platform_notification_styles SET
         header_color = COALESCE($1, header_color),
         header_text = COALESCE($2, header_text),
         body_template = COALESCE($3, body_template),
         footer_text = COALESCE($4, footer_text),
         button_label = COALESCE($5, button_label),
         button_url = COALESCE($6, button_url),
         text_template = COALESCE($7, text_template),
         is_active = COALESCE($8, is_active),
         updated_at = NOW()
       WHERE event_type = $9`,
      [
        header_color ?? null,
        header_text ?? null,
        body_template ?? null,
        footer_text ?? null,
        button_label ?? null,
        button_url ?? null,
        text_template ?? null,
        is_active ?? null,
        event_type,
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[super-admin/notification-styles PATCH] Failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

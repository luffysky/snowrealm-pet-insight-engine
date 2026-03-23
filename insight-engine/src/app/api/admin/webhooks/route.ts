import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

interface WebhookRow extends Record<string, unknown> {
  id: string
  event_type: string
  url: string
  active: boolean
  created_at: string
}

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const rows = await query<WebhookRow>(
      `SELECT * FROM webhook_configs WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[admin/webhooks] GET failed:', error)
    return NextResponse.json({ error: '取得 webhook 設定失敗' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    const body = await request.json()
    const { event_type, url } = body

    if (!event_type || !url) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    // 驗證 URL
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'URL 必須為 HTTPS' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: '無效的 URL' }, { status: 400 })
    }

    const allowedEvents = ['survey.submitted', 'waitlist.joined']
    if (!allowedEvents.includes(event_type)) {
      return NextResponse.json(
        { error: `event_type 必須是: ${allowedEvents.join(', ')}` },
        { status: 400 }
      )
    }

    const { tenantId } = roleCheck
    const row = await queryOne<WebhookRow>(
      `INSERT INTO webhook_configs (id, event_type, url, active, tenant_id)
       VALUES (uuid_generate_v4(), $1, $2, true, $3)
       RETURNING *`,
      [event_type, url, tenantId]
    )
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('[admin/webhooks] POST failed:', error)
    return NextResponse.json({ error: '新增 webhook 失敗' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    await execute(`DELETE FROM webhook_configs WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/webhooks] DELETE failed:', error)
    return NextResponse.json({ error: '刪除 webhook 失敗' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    const body = await request.json()
    const { id, active } = body
    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ error: '缺少 id 或 active' }, { status: 400 })
    }

    await execute(
      `UPDATE webhook_configs SET active = $1 WHERE id = $2`,
      [active, id]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/webhooks] PATCH failed:', error)
    return NextResponse.json({ error: '更新 webhook 失敗' }, { status: 500 })
  }
}

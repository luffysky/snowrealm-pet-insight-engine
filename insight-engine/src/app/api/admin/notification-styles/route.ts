import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { invalidateStyleCache } from '@/lib/lineStyles'
import { getTenantContext } from '@/lib/tenant'

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const rows = await query(
      `SELECT * FROM line_notification_styles WHERE tenant_id = $1 ORDER BY id`, [tenantId]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[admin/notification-styles] GET failed:', error)
    return NextResponse.json({ error: '取得通知樣式失敗' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      id?: string
      header_color?: string
      header_emoji?: string
      header_text?: string
      footer_label?: string
      footer_url?: string
      footer_color?: string
      is_active?: boolean
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    }

    // Validate colors
    if (body.header_color && !COLOR_REGEX.test(body.header_color)) {
      return NextResponse.json({ error: 'header_color 格式錯誤' }, { status: 400 })
    }
    if (body.footer_color && !COLOR_REGEX.test(body.footer_color)) {
      return NextResponse.json({ error: 'footer_color 格式錯誤' }, { status: 400 })
    }

    const result = await query<{ id: string }>(
      `UPDATE line_notification_styles
       SET header_color = COALESCE($2, header_color),
           header_emoji = COALESCE($3, header_emoji),
           header_text = COALESCE($4, header_text),
           footer_label = COALESCE($5, footer_label),
           footer_url = COALESCE($6, footer_url),
           footer_color = COALESCE($7, footer_color),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        body.id,
        body.header_color ?? null,
        body.header_emoji ?? null,
        body.header_text ?? null,
        body.footer_label ?? null,
        body.footer_url ?? null,
        body.footer_color ?? null,
        body.is_active ?? null,
      ]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: '找不到該樣式' }, { status: 404 })
    }

    invalidateStyleCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/notification-styles] PUT failed:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tenantId = request.headers.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const settings = await queryOne(
    `SELECT * FROM site_settings WHERE tenant_id = $1`,
    [tenantId],
  )

  if (!settings) {
    return NextResponse.json({
      site_title: '',
      site_description: '',
      og_title: '',
      og_description: '',
      og_image_url: '',
      og_site_name: '',
      og_locale: 'zh_TW',
      twitter_card: 'summary_large_image',
      favicon_url: '',
      extra_meta: {},
    })
  }

  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const tenantId = request.headers.get('x-tenant-id')
  const role = request.headers.get('x-user-role')
  if (!tenantId) return NextResponse.json({ error: '未授權' }, { status: 401 })
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  try {
    const body = await request.json()

    await query(
      `INSERT INTO site_settings (
        tenant_id, site_title, site_description, admin_title, og_title, og_description,
        og_image_url, og_site_name, og_locale, twitter_card, favicon_url, extra_meta, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
      ON CONFLICT (tenant_id) DO UPDATE SET
        site_title = $2, site_description = $3, admin_title = $4, og_title = $5, og_description = $6,
        og_image_url = $7, og_site_name = $8, og_locale = $9, twitter_card = $10,
        favicon_url = $11, extra_meta = $12, updated_at = now()`,
      [
        tenantId,
        body.site_title ?? '',
        body.site_description ?? '',
        body.admin_title ?? '',
        body.og_title ?? '',
        body.og_description ?? '',
        body.og_image_url ?? '',
        body.og_site_name ?? '',
        body.og_locale ?? 'zh_TW',
        body.twitter_card ?? 'summary_large_image',
        body.favicon_url ?? '',
        JSON.stringify(body.extra_meta ?? {}),
      ],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Site Settings API Error]', err)
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}

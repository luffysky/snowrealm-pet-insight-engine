import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const settings = await queryOne<Record<string, unknown>>(
    `SELECT * FROM site_settings ORDER BY created_at ASC LIMIT 1`
  )

  return NextResponse.json(settings ?? {
    site_title: '',
    site_description: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    og_site_name: '',
    og_locale: 'zh_TW',
    twitter_card: 'summary_large_image',
    favicon_url: '',
  })
}

export async function PUT(request: NextRequest) {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const body = await request.json()

    // 找最早那筆的 tenant_id（作為首頁設定）
    const existing = await queryOne<{ tenant_id: string }>(
      `SELECT tenant_id FROM site_settings ORDER BY created_at ASC LIMIT 1`
    )

    const tenantId = existing?.tenant_id ?? 'default'

    await query(
      `INSERT INTO site_settings (
        tenant_id, site_title, site_description, og_title, og_description,
        og_image_url, og_site_name, og_locale, twitter_card, favicon_url, extra_meta, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
      ON CONFLICT (tenant_id) DO UPDATE SET
        site_title = $2, site_description = $3, og_title = $4, og_description = $5,
        og_image_url = $6, og_site_name = $7, og_locale = $8, twitter_card = $9,
        favicon_url = $10, extra_meta = $11, updated_at = now()`,
      [
        tenantId,
        body.site_title ?? '',
        body.site_description ?? '',
        body.og_title ?? '',
        body.og_description ?? '',
        body.og_image_url ?? '',
        body.og_site_name ?? '',
        body.og_locale ?? 'zh_TW',
        body.twitter_card ?? 'summary_large_image',
        body.favicon_url ?? '',
        JSON.stringify(body.extra_meta ?? {}),
      ]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Super Admin Site Settings Error]', err)
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}

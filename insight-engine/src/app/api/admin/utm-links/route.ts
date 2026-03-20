import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'

interface UtmLinkRow {
  id: string
  name: string
  base_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  full_url: string
  click_count: number
  created_at: string
  [key: string]: unknown
}

function buildFullUrl(baseUrl: string, source: string, medium: string, campaign: string): string {
  const url = new URL(baseUrl)
  if (source) url.searchParams.set('utm_source', source)
  if (medium) url.searchParams.set('utm_medium', medium)
  if (campaign) url.searchParams.set('utm_campaign', campaign)
  return url.toString()
}

// GET /api/admin/utm-links
export async function GET(): Promise<NextResponse> {
  const rows = await query<UtmLinkRow>(
    `SELECT * FROM utm_links ORDER BY created_at DESC`
  )
  return NextResponse.json(rows)
}

// POST /api/admin/utm-links
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { name, base_url, utm_source, utm_medium, utm_campaign } = body

  if (!name || !base_url) {
    return NextResponse.json({ error: '缺少名稱或基礎 URL' }, { status: 400 })
  }

  // Validate URL format
  try {
    new URL(base_url)
  } catch {
    return NextResponse.json({ error: '無效的 URL 格式' }, { status: 400 })
  }

  const fullUrl = buildFullUrl(base_url, utm_source ?? '', utm_medium ?? '', utm_campaign ?? '')

  const row = await queryOne<UtmLinkRow>(
    `INSERT INTO utm_links (name, base_url, utm_source, utm_medium, utm_campaign, full_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, base_url, utm_source ?? '', utm_medium ?? '', utm_campaign ?? '', fullUrl]
  )

  return NextResponse.json(row, { status: 201 })
}

// DELETE /api/admin/utm-links
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const affected = await execute('DELETE FROM utm_links WHERE id = $1', [id])
  if (affected === 0) return NextResponse.json({ error: '連結不存在' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}

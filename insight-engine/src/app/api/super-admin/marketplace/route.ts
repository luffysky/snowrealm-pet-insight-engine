import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { userId, role }
}

interface ItemRow extends Record<string, unknown> {
  id: string
  type: string
  name: string
  description: string | null
  preview_url: string | null
  price_zcoin: number
  creator_id: string | null
  creator_name: string | null
  creator_revenue_pct: number
  ref_id: string | null
  is_active: boolean
  is_featured: boolean
  is_official: boolean
  purchase_count: number
  rating_avg: string
  sort_order: number
  created_at: string
  tags: string | null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const pageSize = 50

  const where = type ? `WHERE type = $1` : ''
  const params: unknown[] = type ? [type, pageSize, (page - 1) * pageSize] : [pageSize, (page - 1) * pageSize]
  const priceIdx = type ? 4 : 3
  const activeIdx = type ? 5 : 4

  const rows = await query<ItemRow>(
    `SELECT id, type, name, description, preview_url, price_zcoin,
            creator_id::text, creator_name, creator_revenue_pct,
            ref_id, is_active, is_featured, is_official,
            purchase_count, rating_avg::text, sort_order, created_at,
            array_to_json(tags)::text AS tags
     FROM marketplace_items
     ${where}
     ORDER BY sort_order ASC, created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  const items = rows.map(r => ({
    ...r,
    tags: r.tags ? JSON.parse(r.tags) as string[] : [],
    ratingAvg: parseFloat(r.rating_avg),
  }))

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as {
    type: string; name: string; description?: string; previewUrl?: string
    priceZcoin?: number; refId?: string; isOfficial?: boolean; isFeatured?: boolean
    creatorId?: string; creatorName?: string; creatorRevenuePct?: number
    sortOrder?: number; tags?: string[]
  }

  if (!body.type || !body.name) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  const item = await queryOne<{ id: string }>(
    `INSERT INTO marketplace_items
     (type, name, description, preview_url, price_zcoin, ref_id,
      is_official, is_featured, creator_id, creator_name, creator_revenue_pct, sort_order, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::text[])
     RETURNING id`,
    [
      body.type, body.name, body.description ?? null, body.previewUrl ?? null,
      body.priceZcoin ?? 0, body.refId ?? null,
      body.isOfficial ?? false, body.isFeatured ?? false,
      body.creatorId ?? null, body.creatorName ?? null,
      body.creatorRevenuePct ?? 70, body.sortOrder ?? 0,
      body.tags ?? [],
    ]
  )

  return NextResponse.json({ ok: true, id: item?.id })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as {
    id: string
    priceZcoin?: number; isActive?: boolean; isFeatured?: boolean
    name?: string; description?: string; previewUrl?: string
    sortOrder?: number; creatorRevenuePct?: number
  }

  if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const updates: string[] = []
  const vals: unknown[] = []
  let idx = 1

  if (body.priceZcoin !== undefined) { updates.push(`price_zcoin=$${idx++}`); vals.push(body.priceZcoin) }
  if (body.isActive !== undefined) { updates.push(`is_active=$${idx++}`); vals.push(body.isActive) }
  if (body.isFeatured !== undefined) { updates.push(`is_featured=$${idx++}`); vals.push(body.isFeatured) }
  if (body.name !== undefined) { updates.push(`name=$${idx++}`); vals.push(body.name) }
  if (body.description !== undefined) { updates.push(`description=$${idx++}`); vals.push(body.description) }
  if (body.previewUrl !== undefined) { updates.push(`preview_url=$${idx++}`); vals.push(body.previewUrl) }
  if (body.sortOrder !== undefined) { updates.push(`sort_order=$${idx++}`); vals.push(body.sortOrder) }
  if (body.creatorRevenuePct !== undefined) { updates.push(`creator_revenue_pct=$${idx++}`); vals.push(body.creatorRevenuePct) }

  if (updates.length === 0) return NextResponse.json({ error: '無可更新欄位' }, { status: 400 })

  updates.push(`updated_at=NOW()`)
  vals.push(body.id)

  await execute(
    `UPDATE marketplace_items SET ${updates.join(',')} WHERE id=$${idx}`,
    vals
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  await execute(`DELETE FROM marketplace_items WHERE id=$1`, [id])
  return NextResponse.json({ ok: true })
}

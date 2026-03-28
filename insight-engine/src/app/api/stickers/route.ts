import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

interface PackRow extends Record<string, unknown> {
  id: string
  name: string
  cover_url: string | null
  sort_order: number
  pack_type: string | null
}

interface StickerRow extends Record<string, unknown> {
  id: string
  pack_id: string
  url: string
  sort_order: number
}

/** GET /api/stickers?type=sticker|emoji — 取得啟用中的貼圖包/表情貼（登入才能用） */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const auth = token ? await verifyToken(token) : null
  if (!auth) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const packType = new URL(req.url).searchParams.get('type') ?? 'sticker'

  const [packs, stickers] = await Promise.all([
    query<PackRow>(
      `SELECT id, name, cover_url, sort_order, COALESCE(pack_type,'sticker') as pack_type
       FROM sticker_packs
       WHERE is_active = true AND COALESCE(pack_type,'sticker') = $1
       ORDER BY sort_order ASC, created_at DESC`,
      [packType]
    ),
    query<StickerRow>(
      `SELECT s.id, s.pack_id, s.url, s.sort_order
       FROM stickers s
       JOIN sticker_packs sp ON sp.id = s.pack_id
       WHERE sp.is_active = true AND COALESCE(sp.pack_type,'sticker') = $1
       ORDER BY s.pack_id, s.sort_order ASC`,
      [packType]
    ),
  ])

  const result = packs.map(pack => ({
    id: pack.id,
    name: pack.name,
    coverUrl: pack.cover_url,
    sortOrder: pack.sort_order,
    packType: pack.pack_type ?? 'sticker',
    stickers: stickers.filter(s => s.pack_id === pack.id).map(s => ({ id: s.id, url: s.url })),
  }))

  return NextResponse.json({ packs: result })
}

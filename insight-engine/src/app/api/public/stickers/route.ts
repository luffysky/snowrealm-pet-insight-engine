import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface PackRow extends Record<string, unknown> {
  id: string
  name: string
  cover_url: string | null
  sort_order: number
  pack_type: string | null
  columns_per_row: number | null
}

interface StickerRow extends Record<string, unknown> {
  id: string
  pack_id: string
  url: string
  sort_order: number
}

/**
 * GET /api/public/stickers?type=sticker|emoji
 *
 * YukiBoard / 外部客戶端用的公開貼圖 API。
 * 驗證方式：Header `X-Api-Key` = PLATFORM_API_KEY（BuildConfig 注入）
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // API Key 驗證
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.PLATFORM_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const packType = new URL(req.url).searchParams.get('type') ?? 'sticker'

  const [packs, stickers] = await Promise.all([
    query<PackRow>(
      `SELECT id, name, cover_url, sort_order,
              COALESCE(pack_type,'sticker') as pack_type,
              COALESCE(columns_per_row, 5) as columns_per_row
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
    columnsPerRow: pack.columns_per_row ?? 5,
    stickers: stickers
      .filter(s => s.pack_id === pack.id)
      .map(s => ({ id: s.id, url: s.url })),
  }))

  return NextResponse.json(
    { packs: result },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

interface PackRow extends Record<string, unknown> {
  id: string
  name: string
  cover_url: string | null
  sort_order: number
}

interface StickerRow extends Record<string, unknown> {
  id: string
  pack_id: string
  url: string
  sort_order: number
}

/** GET /api/stickers — 取得所有啟用中的貼圖包 + 貼圖（登入才能用） */
export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const auth = token ? await verifyToken(token) : null
  if (!auth) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const [packs, stickers] = await Promise.all([
    query<PackRow>(
      `SELECT id, name, cover_url, sort_order FROM sticker_packs WHERE is_active = true ORDER BY sort_order ASC, created_at DESC`
    ),
    query<StickerRow>(
      `SELECT s.id, s.pack_id, s.url, s.sort_order
       FROM stickers s
       JOIN sticker_packs sp ON sp.id = s.pack_id
       WHERE sp.is_active = true
       ORDER BY s.pack_id, s.sort_order ASC`
    ),
  ])

  const result = packs.map(pack => ({
    id: pack.id,
    name: pack.name,
    coverUrl: pack.cover_url,
    sortOrder: pack.sort_order,
    stickers: stickers.filter(s => s.pack_id === pack.id).map(s => ({ id: s.id, url: s.url })),
  }))

  return NextResponse.json({ packs: result })
}

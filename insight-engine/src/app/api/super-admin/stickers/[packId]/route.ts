import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { sub: userId, role }
}

interface StickerRow extends Record<string, unknown> {
  id: string
  url: string
  filename: string | null
  sort_order: number
}

/** GET — 取得貼圖包內所有貼圖 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId } = await params
  const stickers = await query<StickerRow>(
    `SELECT id, url, filename, sort_order FROM stickers WHERE pack_id = $1 ORDER BY sort_order ASC`,
    [packId]
  )
  return NextResponse.json({ stickers })
}

/** PATCH — 更新貼圖包（名稱、說明、is_active、sort_order） */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId } = await params
  const body = await req.json() as { name?: string; description?: string; isActive?: boolean; sortOrder?: number }

  await execute(
    `UPDATE sticker_packs SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       is_active = COALESCE($3, is_active),
       sort_order = COALESCE($4, sort_order)
     WHERE id = $5`,
    [body.name ?? null, body.description ?? null, body.isActive ?? null, body.sortOrder ?? null, packId]
  )
  return NextResponse.json({ ok: true })
}

/** DELETE — 刪除貼圖包（stickers 由 CASCADE 刪除） */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId } = await params
  await execute(`DELETE FROM sticker_packs WHERE id = $1`, [packId])
  return NextResponse.json({ ok: true })
}

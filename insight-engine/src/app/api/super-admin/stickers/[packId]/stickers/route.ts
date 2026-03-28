import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { headers } from 'next/headers'
import { uploadToR2 } from '@/lib/r2'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { sub: userId }
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])
const MIME_MAP: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp',
}

/** POST — 新增單張/多張圖片到現有貼圖包 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId } = await params

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (!files.length) return NextResponse.json({ error: '請選擇圖片' }, { status: 400 })

  // 取得目前最大 sort_order
  const maxRow = await queryOne<{ max: number | null }>(
    `SELECT MAX(sort_order) AS max FROM stickers WHERE pack_id = $1`, [packId]
  )
  let nextOrder = (maxRow?.max ?? -1) + 1

  const uploaded: { url: string }[] = []
  for (const file of files) {
    const lower = file.name.toLowerCase()
    const ext = lower.slice(lower.lastIndexOf('.'))
    if (!IMAGE_EXTS.has(ext)) continue
    if (file.size > 5 * 1024 * 1024) continue // 單張最大 5MB

    const buf = Buffer.from(await file.arrayBuffer())
    const mime = MIME_MAP[ext] ?? 'image/png'
    const url = await uploadToR2(buf, `${packId}-${nextOrder}-${file.name}`, mime, 'stickers')
    await execute(
      `INSERT INTO stickers (pack_id, url, filename, sort_order) VALUES ($1, $2, $3, $4)`,
      [packId, url, file.name, nextOrder]
    )
    uploaded.push({ url })
    nextOrder++
  }

  // 若貼圖包尚無封面，用第一張更新
  if (uploaded.length > 0) {
    await execute(
      `UPDATE sticker_packs SET cover_url = COALESCE(cover_url, $1) WHERE id = $2`,
      [uploaded[0].url, packId]
    )
  }

  return NextResponse.json({ ok: true, count: uploaded.length })
}

/** PATCH — 批次更新排序 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId } = await params

  const body = await req.json() as { reorder: { id: string; sort_order: number }[] }
  if (!Array.isArray(body.reorder)) return NextResponse.json({ error: '格式錯誤' }, { status: 400 })

  for (const item of body.reorder) {
    await execute(
      `UPDATE stickers SET sort_order = $1 WHERE id = $2 AND pack_id = $3`,
      [item.sort_order, item.id, packId]
    )
  }

  // 重新取得排序後的貼圖
  const stickers = await query<{ id: string; url: string; filename: string | null; sort_order: number }>(
    `SELECT id, url, filename, sort_order FROM stickers WHERE pack_id = $1 ORDER BY sort_order ASC`,
    [packId]
  )
  return NextResponse.json({ ok: true, stickers })
}

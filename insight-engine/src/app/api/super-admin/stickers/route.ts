import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { headers } from 'next/headers'
import { uploadToR2 } from '@/lib/r2'
import AdmZip from 'adm-zip'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { sub: userId, role }
}

interface PackRow extends Record<string, unknown> {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  sticker_count: string
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

/** GET — 列出所有貼圖包（含每包數量） */
export async function GET(): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const packs = await query<PackRow>(
    `SELECT sp.*, COUNT(s.id)::text AS sticker_count
     FROM sticker_packs sp
     LEFT JOIN stickers s ON s.pack_id = sp.id
     GROUP BY sp.id
     ORDER BY sp.sort_order ASC, sp.created_at DESC`
  )
  return NextResponse.json({ packs })
}

/** POST — 上傳 zip 建立貼圖包 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const formData = await req.formData()
  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const file = formData.get('file') as File | null

  if (!name) return NextResponse.json({ error: '請填寫貼圖包名稱' }, { status: 400 })
  if (!file) return NextResponse.json({ error: '請上傳 zip 檔案' }, { status: 400 })
  if (!file.name.endsWith('.zip')) return NextResponse.json({ error: '只接受 .zip 檔案' }, { status: 400 })
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'zip 大小不能超過 50MB' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
      .filter(e => {
        if (e.isDirectory) return false
        const lower = e.entryName.toLowerCase()
        // Skip macOS metadata and hidden files
        if (lower.includes('__macosx') || lower.startsWith('.')) return false
        const ext = lower.slice(lower.lastIndexOf('.'))
        return IMAGE_EXTS.has(ext)
      })
      .sort((a, b) => a.entryName.localeCompare(b.entryName))

    if (entries.length === 0) {
      return NextResponse.json({ error: 'zip 中找不到圖片檔案（支援 PNG/JPG/GIF/WebP）' }, { status: 400 })
    }

    // 建立貼圖包
    const pack = await queryOne<{ id: string }>(
      `INSERT INTO sticker_packs (name, description) VALUES ($1, $2) RETURNING id`,
      [name, description]
    )
    if (!pack) throw new Error('建立貼圖包失敗')

    // 上傳每張貼圖到 R2
    const uploaded: { url: string; filename: string; order: number }[] = []
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const imgBuffer = entry.getData()
      const lower = entry.entryName.toLowerCase()
      const ext = lower.slice(lower.lastIndexOf('.'))
      const mimeMap: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
      const mime = mimeMap[ext] ?? 'image/png'
      const filename = entry.entryName.split('/').pop() ?? `sticker-${i}`
      const url = await uploadToR2(imgBuffer, `${pack.id}-${i}-${filename}`, mime, 'stickers')
      uploaded.push({ url, filename, order: i })
    }

    // 批量寫入 stickers
    for (const s of uploaded) {
      await execute(
        `INSERT INTO stickers (pack_id, url, filename, sort_order) VALUES ($1, $2, $3, $4)`,
        [pack.id, s.url, s.filename, s.order]
      )
    }

    // 第一張作為封面
    await execute(
      `UPDATE sticker_packs SET cover_url = $1 WHERE id = $2`,
      [uploaded[0].url, pack.id]
    )

    return NextResponse.json({ ok: true, packId: pack.id, count: uploaded.length })
  } catch (err) {
    console.error('[sticker upload]', err)
    return NextResponse.json({ error: '上傳失敗，請確認 zip 格式正確' }, { status: 500 })
  }
}

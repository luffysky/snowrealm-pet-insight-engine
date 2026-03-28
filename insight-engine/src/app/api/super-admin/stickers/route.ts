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

/** GET — 列出所有貼圖包（含每包數量），可用 ?type=sticker|emoji 篩選 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const packType = new URL(req.url).searchParams.get('type')

  const packs = await query<PackRow>(
    packType
      ? `SELECT sp.*, COUNT(s.id)::text AS sticker_count
         FROM sticker_packs sp
         LEFT JOIN stickers s ON s.pack_id = sp.id
         WHERE COALESCE(sp.pack_type,'sticker') = $1
         GROUP BY sp.id
         ORDER BY sp.sort_order ASC, sp.created_at DESC`
      : `SELECT sp.*, COUNT(s.id)::text AS sticker_count
         FROM sticker_packs sp
         LEFT JOIN stickers s ON s.pack_id = sp.id
         GROUP BY sp.id
         ORDER BY sp.sort_order ASC, sp.created_at DESC`,
    packType ? [packType] : undefined
  )
  return NextResponse.json({ packs })
}

/** POST — 上傳 zip 建立貼圖包 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sticker POST] formData parse error:', msg)
    return NextResponse.json({ error: `表單解析失敗：${msg.slice(0, 120)}` }, { status: 400 })
  }

  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const file = formData.get('file') as File | null
  const packType = (formData.get('packType') as string | null) ?? 'sticker'

  if (!name) return NextResponse.json({ error: '請填寫貼圖包名稱' }, { status: 400 })

  try {
    // 建立貼圖包（不管有沒有 zip）
    const pack = await queryOne<{ id: string }>(
      `INSERT INTO sticker_packs (name, description, pack_type) VALUES ($1, $2, $3) RETURNING id`,
      [name, description, packType]
    )
    if (!pack) throw new Error('建立貼圖包失敗')

    // 沒有提供 zip 則直接回傳空包
    if (!file) {
      return NextResponse.json({ ok: true, packId: pack.id, count: 0 })
    }

    if (!file.name.endsWith('.zip')) return NextResponse.json({ error: '只接受 .zip 檔案' }, { status: 400 })
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'zip 大小不能超過 50MB' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
      .filter(e => {
        if (e.isDirectory) return false
        const lower = e.entryName.toLowerCase()
        if (lower.includes('__macosx') || lower.startsWith('.')) return false
        const ext = lower.slice(lower.lastIndexOf('.'))
        return IMAGE_EXTS.has(ext)
      })
      .sort((a, b) => a.entryName.localeCompare(b.entryName))

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, packId: pack.id, count: 0 })
    }

    const mimeMap: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }

    // Upload all images in parallel (5 concurrent) to avoid timeouts on large zips
    const CONCURRENCY = 5
    const uploaded: { url: string; filename: string; order: number }[] = []
    for (let i = 0; i < entries.length; i += CONCURRENCY) {
      const batch = entries.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(async (entry, batchIdx) => {
        const imgBuffer = entry.getData()
        if (!imgBuffer) throw new Error(`Cannot extract: ${entry.entryName}`)
        const lower = entry.entryName.toLowerCase()
        const ext = lower.slice(lower.lastIndexOf('.'))
        const mime = mimeMap[ext] ?? 'image/png'
        const filename = entry.entryName.split('/').pop() ?? `sticker-${i + batchIdx}`
        const url = await uploadToR2(imgBuffer, `sticker-${i + batchIdx}-${filename}`, mime, 'stickers')
        return { url, filename, order: i + batchIdx }
      }))
      uploaded.push(...results)
    }

    // Batch insert stickers
    for (const s of uploaded) {
      await execute(
        `INSERT INTO stickers (pack_id, url, filename, sort_order) VALUES ($1, $2, $3, $4)`,
        [pack.id, s.url, s.filename, s.order]
      )
    }

    await execute(`UPDATE sticker_packs SET cover_url = $1 WHERE id = $2`, [uploaded[0].url, pack.id])

    return NextResponse.json({ ok: true, packId: pack.id, count: uploaded.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sticker upload]', message)
    return NextResponse.json({ error: `上傳失敗：${message.slice(0, 100)}` }, { status: 500 })
  }
}

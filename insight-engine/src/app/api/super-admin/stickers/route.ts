import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { headers } from 'next/headers'
import { uploadToR2 } from '@/lib/r2'
import AdmZip from 'adm-zip'
import { verifyToken } from '@/lib/jwt'

async function requireSuperAdmin(req?: NextRequest) {
  // Primary: middleware-injected headers
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (userId && role === 'super_admin') return { sub: userId, role }

  // Fallback: read JWT cookie directly (used for multipart requests where middleware skips header injection)
  const token = req?.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants ?? []
  const isSuper = tenants.some(t => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return { sub: payload.sub, role: 'super_admin' }
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
  const auth = await requireSuperAdmin(req)
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

/** POST — 建立貼圖包（JSON）或上傳 zip（application/octet-stream + query params）*/
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin(req)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''
  const url = new URL(req.url)

  // ── 模式 A：application/octet-stream — 串流上傳 zip ──
  if (contentType.startsWith('application/octet-stream')) {
    const packId = url.searchParams.get('packId')
    if (!packId) return NextResponse.json({ error: '缺少 packId' }, { status: 400 })

    try {
      const buffer = Buffer.from(await req.arrayBuffer())
      if (buffer.length === 0) return NextResponse.json({ error: '收到空的上傳內容，請確認檔案已選取並重試' }, { status: 400 })
      if (buffer.length > 50 * 1024 * 1024) return NextResponse.json({ error: 'zip 大小不能超過 50MB' }, { status: 400 })

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

      if (entries.length === 0) return NextResponse.json({ ok: true, packId, count: 0 })

      const mimeMap: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
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
          const url2 = await uploadToR2(imgBuffer, `sticker-${i + batchIdx}-${filename}`, mime, 'stickers')
          return { url: url2, filename, order: i + batchIdx }
        }))
        uploaded.push(...results)
      }
      for (const s of uploaded) {
        await execute(`INSERT INTO stickers (pack_id, url, filename, sort_order) VALUES ($1, $2, $3, $4)`, [packId, s.url, s.filename, s.order])
      }
      await execute(`UPDATE sticker_packs SET cover_url = $1 WHERE id = $2`, [uploaded[0].url, packId])
      return NextResponse.json({ ok: true, packId, count: uploaded.length })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `上傳失敗：${message.slice(0, 100)}` }, { status: 500 })
    }
  }

  // ── 模式 B：application/json — 建立空貼圖包 ──
  let body: { name?: string; description?: string; packType?: string } = {}
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 })
  }

  const name = body.name?.trim()
  const description = body.description?.trim() || null
  const packType = body.packType ?? 'sticker'

  if (!name) return NextResponse.json({ error: '請填寫貼圖包名稱' }, { status: 400 })

  try {
    const pack = await queryOne<{ id: string }>(
      `INSERT INTO sticker_packs (name, description, pack_type) VALUES ($1, $2, $3) RETURNING id`,
      [name, description, packType]
    )
    if (!pack) throw new Error('建立貼圖包失敗')
    return NextResponse.json({ ok: true, packId: pack.id, count: 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `建立失敗：${message.slice(0, 100)}` }, { status: 500 })
  }
}


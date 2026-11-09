import { NextRequest, NextResponse } from 'next/server'
import { createPresignedUpload } from '@/lib/r2'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

const MB = 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const FOLDER_RE = /^[a-zA-Z0-9_-]{1,40}$/

/**
 * POST { kind: 'image' | 'dm', filename, contentType, size, folder? }：簽名直傳。
 * POST { action: 'register', url, filename, contentType, size, folder }：直傳完成後寫入 media_assets。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '參數錯誤' }, { status: 400 })

  const isDm = body.kind === 'dm'
  const roleCheck = await requireRole(isDm ? 'viewer' : 'editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const folder = FOLDER_RE.test(String(body.folder ?? '')) ? String(body.folder) : 'og'
  const contentType = String(body.contentType ?? '')
  const size = Number(body.size)

  try {
    if (body.action === 'register') {
      const base = `${process.env.R2_PUBLIC_URL}/${folder}/`
      if (typeof body.url !== 'string' || !body.url.startsWith(base)) {
        return NextResponse.json({ error: '網址不正確' }, { status: 400 })
      }
      await query(
        `INSERT INTO media_assets (tenant_id, url, filename, original_name, mime_type, size_bytes, folder, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [roleCheck.tenantId, body.url, body.filename, body.filename, contentType, size, folder, roleCheck.userId],
      )
      return NextResponse.json({ success: true })
    }

    const max = isDm ? 500 * MB : 10 * MB
    if (!isDm && !IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json({ error: '只支援 JPG、PNG、WebP、GIF、SVG 格式' }, { status: 400 })
    }
    if (!Number.isFinite(size) || size <= 0 || size > max) {
      return NextResponse.json({ error: `檔案大小不能超過 ${max / MB}MB` }, { status: 400 })
    }
    return NextResponse.json(
      await createPresignedUpload(String(body.filename ?? 'file'), contentType, size, isDm ? 'dm' : folder),
    )
  } catch (err) {
    console.error('[Admin Presign Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

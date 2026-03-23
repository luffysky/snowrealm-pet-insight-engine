import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  try {
    const { tenantId, userId } = roleCheck

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'og'

    if (!file) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只支援 JPG、PNG、WebP、GIF、SVG 格式' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '檔案大小不能超過 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type, folder)

    // 記錄到 media_assets
    await query(
      `INSERT INTO media_assets (tenant_id, url, filename, original_name, mime_type, size_bytes, folder, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, url, file.name, file.name, file.type, file.size, folder, userId],
    )

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[Upload API Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { createPresignedUpload } from '@/lib/r2'

const MAX_SIZE = 10 * 1024 * 1024
const FOLDER_RE = /^[a-zA-Z0-9_-]{1,40}$/

/** POST { filename, contentType, size, folder }：超級管理員的大圖直傳 R2。 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (payload?.role !== 'super_admin') return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const size = Number(body?.size)
  const contentType = String(body?.contentType ?? '')
  if (!contentType.startsWith('image/')) return NextResponse.json({ error: '只支援圖片' }, { status: 400 })
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
    return NextResponse.json({ error: '檔案大小不能超過 10MB' }, { status: 400 })
  }
  const folder = FOLDER_RE.test(String(body.folder ?? '')) ? String(body.folder) : 'og'
  try {
    return NextResponse.json(await createPresignedUpload(String(body.filename ?? 'file'), contentType, size, folder))
  } catch (err) {
    console.error('[Super Admin Presign Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

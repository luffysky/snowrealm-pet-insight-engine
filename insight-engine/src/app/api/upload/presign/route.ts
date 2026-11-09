import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { createPresignedUpload } from '@/lib/r2'

const MB = 1024 * 1024
const KINDS: Record<string, { folder: string; max: number; type: RegExp }> = {
  media: { folder: 'posts', max: 10 * MB, type: /^(image|video)\// },
  audio: { folder: 'audio', max: 50 * MB, type: /^audio\/|^video\/webm$/ },
  video: { folder: 'tmp-video', max: 200 * MB, type: /^video\// },
}

/** POST { kind, filename, contentType, size }：登入使用者的大檔直傳 R2。 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('admin_session')?.value
  const auth = token ? await verifyToken(token) : null
  if (!auth) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const rule = KINDS[String(body?.kind)]
  const size = Number(body?.size)
  const contentType = String(body?.contentType ?? '')
  if (!rule || !rule.type.test(contentType)) {
    return NextResponse.json({ error: '不支援的檔案類型' }, { status: 400 })
  }
  if (!Number.isFinite(size) || size <= 0 || size > rule.max) {
    return NextResponse.json({ error: `檔案大小不能超過 ${rule.max / MB}MB` }, { status: 400 })
  }
  try {
    return NextResponse.json(await createPresignedUpload(String(body.filename ?? 'file'), contentType, size, rule.folder))
  } catch (err) {
    console.error('[Upload Presign Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

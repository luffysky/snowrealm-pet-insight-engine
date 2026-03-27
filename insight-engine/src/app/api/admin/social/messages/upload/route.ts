import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { requireRole } from '@/lib/tenant'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'img',
  'image/jpg': 'img',
  'image/png': 'img',
  'image/webp': 'img',
  'image/gif': 'img',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/m4a': 'audio',
  'audio/aac': 'audio',
  'application/pdf': 'file',
  'application/zip': 'file',
  'text/plain': 'file',
}
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: '檔案最大 50MB' }, { status: 400 })

    const mediaType = ALLOWED_TYPES[file.type]
    if (!mediaType) return NextResponse.json({ error: '不支援的檔案格式' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type, 'dm')

    return NextResponse.json({ url, mediaType, filename: file.name })
  } catch (err) {
    console.error('[DM upload]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

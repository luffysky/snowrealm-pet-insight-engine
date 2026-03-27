import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { requireRole } from '@/lib/tenant'

const ALLOWED_TYPES: Record<string, string> = {
  // Images
  'image/jpeg': 'img',
  'image/jpg': 'img',
  'image/png': 'img',
  'image/webp': 'img',
  'image/gif': 'img',
  'image/heic': 'img',
  'image/heif': 'img',
  // Videos
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/x-matroska': 'video',
  'video/3gpp': 'video',
  'video/x-m4v': 'video',
  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/m4a': 'audio',
  'audio/x-m4a': 'audio',
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  'audio/x-wav': 'audio',
  'audio/webm': 'audio',
  // Files
  'application/pdf': 'file',
  'application/zip': 'file',
  'text/plain': 'file',
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

// Supported formats for display in UI
export const SUPPORTED_FORMATS = {
  image: 'JPG、PNG、WebP、GIF、HEIC',
  video: 'MP4、WebM、MOV、3GP',
  audio: 'MP3、WAV、AAC、M4A、OGG',
  file: 'PDF、ZIP、TXT',
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: '檔案最大 50MB' }, { status: 400 })

    // Try to detect by MIME type first, then by extension
    let mediaType = ALLOWED_TYPES[file.type]
    if (!mediaType) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const extMap: Record<string, string> = {
        jpg: 'img', jpeg: 'img', png: 'img', webp: 'img', gif: 'img', heic: 'img', heif: 'img',
        mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video', '3gp': 'video', m4v: 'video',
        mp3: 'audio', wav: 'audio', aac: 'audio', m4a: 'audio', ogg: 'audio',
        pdf: 'file', zip: 'file', txt: 'file',
      }
      mediaType = extMap[ext ?? ''] ?? ''
    }

    if (!mediaType) {
      return NextResponse.json({
        error: `不支援的格式。支援：圖片(${SUPPORTED_FORMATS.image})、影片(${SUPPORTED_FORMATS.video})、音訊(${SUPPORTED_FORMATS.audio})、檔案(${SUPPORTED_FORMATS.file})`
      }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type || 'application/octet-stream', 'dm')

    return NextResponse.json({ url, mediaType, filename: file.name })
  } catch (err) {
    console.error('[DM upload]', err)
    return NextResponse.json({ error: '上傳失敗，請確認檔案格式和大小（上限 50MB）' }, { status: 500 })
  }
}

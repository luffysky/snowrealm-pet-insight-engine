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

const MAX_SIZE = 500 * 1024 * 1024 // 500 MB（影片/檔案放寬；再大需改 presigned 直傳避免 server OOM）

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
    if (file.size > MAX_SIZE) return NextResponse.json({ error: '檔案最大 500MB' }, { status: 400 })

    // Try to detect by MIME type first, then by extension
    // Normalize MIME: strip codec params (e.g. "audio/webm;codecs=opus" → "audio/webm")
    const normalizedMime = file.type.split(';')[0].toLowerCase()
    let mediaType = ALLOWED_TYPES[normalizedMime]
    if (!mediaType) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      // Note: webm/mp4 are ambiguous (can be audio or video). When MIME type is missing,
      // assume video for these — but voice recordings always carry a proper MIME type,
      // so they will have been resolved above before reaching this fallback.
      const extMap: Record<string, string> = {
        jpg: 'img', jpeg: 'img', png: 'img', webp: 'img', gif: 'img', heic: 'img', heif: 'img',
        mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video', '3gp': 'video', m4v: 'video',
        mp3: 'audio', wav: 'audio', aac: 'audio', m4a: 'audio', ogg: 'audio',
        pdf: 'file', zip: 'file', txt: 'file',
      }
      mediaType = extMap[ext ?? ''] ?? ''
    }

    // 仍判斷不出來 → 用 MIME 大類前綴分類；再不行一律當「附件」(file) → 支援所有格式
    if (!mediaType) {
      if (normalizedMime.startsWith('image/')) mediaType = 'img'
      else if (normalizedMime.startsWith('video/')) mediaType = 'video'
      else if (normalizedMime.startsWith('audio/')) mediaType = 'audio'
      else mediaType = 'file'
    }

    // Determine correct content-type for R2 (browser sometimes sends empty MIME)
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      avi: 'video/x-msvideo', mkv: 'video/x-matroska', '3gp': 'video/3gpp', m4v: 'video/x-m4v',
      mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac',
      m4a: 'audio/mp4', ogg: 'audio/ogg',
      pdf: 'application/pdf', zip: 'application/zip', txt: 'text/plain',
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const resolvedContentType = normalizedMime || mimeMap[ext] || 'application/octet-stream'

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, resolvedContentType, 'dm')

    return NextResponse.json({ url, mediaType, filename: file.name })
  } catch (err) {
    console.error('[DM upload]', err)
    return NextResponse.json({ error: '上傳失敗，請確認檔案格式和大小（上限 500MB）' }, { status: 500 })
  }
}

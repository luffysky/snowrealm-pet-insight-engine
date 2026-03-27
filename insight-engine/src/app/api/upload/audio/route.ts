import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { uploadToR2 } from '@/lib/r2'

const ALLOWED_TYPES = [
  'audio/webm', 'audio/webm;codecs=opus',
  'audio/ogg', 'audio/ogg;codecs=opus',
  'audio/mp4', 'audio/mpeg', 'audio/wav',
  'audio/x-m4a', 'audio/aac',
  'application/octet-stream', // fallback for some browsers
]
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '請選擇音訊檔案' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '音訊大小不能超過 50MB' }, { status: 400 })
    }

    const mimeType = file.type || 'audio/webm'
    // Determine extension
    let ext = 'webm'
    if (mimeType.includes('ogg')) ext = 'ogg'
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a'
    else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) ext = 'mp3'
    else if (mimeType.includes('wav')) ext = 'wav'
    else if (mimeType.includes('aac')) ext = 'aac'

    const filename = `voice-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, filename, mimeType, 'audio')

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[Audio Upload Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

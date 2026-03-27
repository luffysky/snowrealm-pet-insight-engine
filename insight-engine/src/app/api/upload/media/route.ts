import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { uploadToR2 } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只支援 JPG、PNG、WebP、GIF 格式' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '圖片大小不能超過 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type, 'posts')

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[Media Upload Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

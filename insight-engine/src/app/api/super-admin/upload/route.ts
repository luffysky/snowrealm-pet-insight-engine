import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { verifyToken } from '@/lib/jwt'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'og'

    if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只支援 JPG、PNG、WebP、GIF、SVG、ICO 格式' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '檔案大小不能超過 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2(buffer, file.name, file.type, folder)

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[Super Admin Upload Error]', err)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}

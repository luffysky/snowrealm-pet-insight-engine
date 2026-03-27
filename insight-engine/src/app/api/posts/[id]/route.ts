import { NextRequest, NextResponse } from 'next/server'
import { getPost } from '@/lib/socialEngine'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 嘗試取得當前登入用戶，讓 myReaction / isBookmarked 正確回傳
  const sessionToken = req.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken).catch(() => null) : null
  const viewerId = auth?.sub

  const post = await getPost(id, viewerId)
  if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  return NextResponse.json({ post })
}

import { NextRequest, NextResponse } from 'next/server'
import { getPost } from '@/lib/socialEngine'
import { verifyToken } from '@/lib/jwt'
import { queryOne } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const sessionToken = req.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken).catch(() => null) : null
  const viewerId = auth?.sub

  // 密碼保護：先查 password_hash，若有則需驗證 unlock cookie
  const pwRow = await queryOne<{ user_id: string; password_hash: string | null }>(
    `SELECT user_id, password_hash FROM social_posts WHERE id = $1`,
    [id]
  )
  if (pwRow?.password_hash) {
    const isOwner = viewerId === pwRow.user_id
    if (!isOwner) {
      const unlockCookie = req.cookies.get(`post_unlock_${id}`)?.value
      if (unlockCookie !== '1') {
        return NextResponse.json({
          post: {
            id,
            isPasswordProtected: true,
            content: '',
            images: [],
            tags: [],
          },
          isPasswordProtected: true,
        })
      }
    }
  }

  const post = await getPost(id, viewerId)
  if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  return NextResponse.json({ post })
}

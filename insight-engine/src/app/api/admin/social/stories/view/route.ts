import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { execute } from '@/lib/db'

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string }
}

/** POST /api/admin/social/stories/view — 記錄觀看 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ ok: false })

  const { storyId } = await req.json() as { storyId: string }
  if (!storyId) return NextResponse.json({ error: '缺少 storyId' }, { status: 400 })

  // 觀看去重（UNIQUE 約束自動處理，ignore duplicate）
  await execute(
    `INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [storyId, auth.userId]
  )

  // 更新觀看數
  await execute(
    `UPDATE stories SET view_count = view_count + 1 WHERE id = $1`,
    [storyId]
  )

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** POST /api/yukiboard/social/share — 分享到 Insight 貼文 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireYukiBoardAuth(req)
    if (!userId) {
      return NextResponse.json({ error: '需要登入' }, { status: 401 })
    }

    const { content, source, skill } = await req.json()

    if (!content || content.length > 500) {
      return NextResponse.json({ error: '內容不合法（空白或超過 500 字）' }, { status: 400 })
    }

    // 取得用戶所屬 tenant
    const user = await queryOne<{ tenant_id: string; display_name: string }>(
      `SELECT tenant_id, display_name FROM admin_users WHERE id = $1`,
      [userId],
    )
    if (!user) {
      return NextResponse.json({ error: '用戶不存在' }, { status: 404 })
    }

    // 建立貼文
    const post = await queryOne<{ id: string }>(
      `INSERT INTO posts (tenant_id, author_id, author_name, content, tags, metadata, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', NOW())
       RETURNING id`,
      [
        user.tenant_id,
        userId,
        user.display_name,
        content.slice(0, 500),
        JSON.stringify(['yukiboard', skill].filter(Boolean)),
        JSON.stringify({ source: source ?? 'yukiboard', skill: skill ?? '' }),
      ],
    )

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'

    return NextResponse.json({
      post_id: post?.id ?? '',
      post_url: `${baseUrl}/post/${post?.id ?? ''}`,
    })
  } catch (error) {
    console.error('[Social Share]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

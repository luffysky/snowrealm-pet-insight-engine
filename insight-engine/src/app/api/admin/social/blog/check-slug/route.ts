import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne } from '@/lib/db'

/** GET /api/admin/social/blog/check-slug?slug=xxx&exclude=articleId */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  const exclude = req.nextUrl.searchParams.get('exclude')

  if (!slug) return NextResponse.json({ available: false, error: '缺少 slug' })
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, error: 'Slug 只能包含小寫英文、數字和連字號' })
  }

  const params: string[] = [ctx.userId, slug]
  let excludeClause = ''
  if (exclude) {
    params.push(exclude)
    excludeClause = `AND id::text != $${params.length}`
  }

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM user_blog_articles WHERE user_id::text = $1 AND slug = $2 ${excludeClause}`,
    params
  )

  return NextResponse.json({ available: !existing })
}

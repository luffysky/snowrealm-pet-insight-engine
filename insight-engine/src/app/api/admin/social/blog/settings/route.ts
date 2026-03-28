import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne } from '@/lib/db'

interface BlogSettingsRow extends Record<string, unknown> {
  id: string
  user_id: string
  blog_slug: string | null
  blog_title: string | null
  blog_desc: string | null
  is_enabled: boolean
}

export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const settings = await queryOne<BlogSettingsRow>(
    `SELECT id, user_id, blog_slug, blog_title, blog_desc, is_enabled
     FROM user_blog_settings WHERE user_id::text = $1`,
    [ctx.userId]
  )

  return NextResponse.json({ settings: settings ?? null })
}

export async function PATCH(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json() as {
    blogSlug?: string | null
    blogTitle?: string | null
    blogDesc?: string | null
    isEnabled?: boolean
  }

  // 驗證 blog_slug 格式
  if (body.blogSlug) {
    if (!/^[a-z0-9-]{3,30}$/.test(body.blogSlug)) {
      return NextResponse.json({ error: 'Blog slug 需 3-30 字元，只能含小寫英文、數字和連字號' }, { status: 400 })
    }
    // 確認唯一性（不含自己）
    const conflict = await queryOne<{ id: string }>(
      `SELECT id FROM user_blog_settings WHERE blog_slug = $1 AND user_id::text != $2`,
      [body.blogSlug, ctx.userId]
    )
    if (conflict) return NextResponse.json({ error: '此 Blog slug 已被使用' }, { status: 409 })
  }

  const settings = await queryOne<BlogSettingsRow>(
    `INSERT INTO user_blog_settings (user_id, blog_slug, blog_title, blog_desc, is_enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       blog_slug  = COALESCE(EXCLUDED.blog_slug, user_blog_settings.blog_slug),
       blog_title = COALESCE(EXCLUDED.blog_title, user_blog_settings.blog_title),
       blog_desc  = COALESCE(EXCLUDED.blog_desc, user_blog_settings.blog_desc),
       is_enabled = COALESCE(EXCLUDED.is_enabled, user_blog_settings.is_enabled),
       updated_at = NOW()
     RETURNING id, user_id, blog_slug, blog_title, blog_desc, is_enabled`,
    [
      ctx.userId,
      body.blogSlug ?? null,
      body.blogTitle ?? null,
      body.blogDesc ?? null,
      body.isEnabled ?? null,
    ]
  )

  return NextResponse.json({ settings })
}

import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { queryOne } from '@/lib/db'

/** 產生 preview token：base64url(sha256(articleId + JWT_SECRET)) 前 12 字元 */
async function generatePreviewToken(articleId: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? process.env.ADMIN_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET or ADMIN_SECRET')
  const data = new TextEncoder().encode(articleId + secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashBytes = new Uint8Array(hashBuffer)
  let binary = ''
  for (let i = 0; i < hashBytes.length; i++) binary += String.fromCharCode(hashBytes[i])
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return b64.slice(0, 12)
}

/** GET /api/admin/social/blog/[id]/preview-token
 *  為草稿文章產生預覽 token，作者本人才能呼叫
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { id } = await params

  const article = await queryOne<{ id: string; slug: string; user_id: string; blog_slug: string | null }>(
    `SELECT a.id, a.slug, a.user_id::text AS user_id, ubs.blog_slug
     FROM user_blog_articles a
     LEFT JOIN user_blog_settings ubs ON ubs.user_id = a.user_id
     WHERE a.id = $1`,
    [id]
  )

  if (!article) return NextResponse.json({ error: '找不到文章' }, { status: 404 })
  if (article.user_id !== ctx.userId) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const token = await generatePreviewToken(article.id)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
  const blogSlug = article.blog_slug ?? ctx.userId
  const previewUrl = `${baseUrl}/blogs/${blogSlug}/${article.slug}?preview_token=${token}`

  return NextResponse.json({ previewUrl, token })
}

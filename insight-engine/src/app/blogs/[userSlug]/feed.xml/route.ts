import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  const { userSlug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

  const blog = await queryOne<{
    blog_slug: string | null
    blog_title: string | null
    blog_desc: string | null
    author_name: string | null
  }>(
    `SELECT ubs.blog_slug, ubs.blog_title, ubs.blog_desc, au.display_name AS author_name
     FROM user_blog_settings ubs
     LEFT JOIN admin_users au ON au.id = ubs.user_id
     WHERE ubs.blog_slug = $1 AND ubs.is_enabled = true`,
    [userSlug]
  )

  if (!blog) return new NextResponse('Not Found', { status: 404 })

  const articles = await query<{
    title: string
    slug: string
    summary: string | null
    published_at: string
    tags: string[]
  }>(
    `SELECT a.title, a.slug, a.summary, a.published_at, a.tags
     FROM user_blog_articles a
     JOIN user_blog_settings s ON s.user_id = a.user_id
     WHERE s.blog_slug = $1 AND a.is_public = true
     ORDER BY a.published_at DESC LIMIT 20`,
    [userSlug]
  )

  const blogUrl = `${baseUrl}/blogs/${userSlug}`
  const title = blog.blog_title ?? `${blog.author_name ?? userSlug} 的部落格`
  const description = blog.blog_desc ?? title

  const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${blogUrl}/${a.slug}</link>
      <guid isPermaLink="true">${blogUrl}/${a.slug}</guid>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      ${a.summary ? `<description><![CDATA[${a.summary}]]></description>` : ''}
      ${(a.tags ?? []).map(t => `<category><![CDATA[${t}]]></category>`).join('')}
    </item>`).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${blogUrl}</link>
    <description><![CDATA[${description}]]></description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${blogUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

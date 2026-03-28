import { NextRequest, NextResponse } from 'next/server'

const TIMEOUT_MS = 5000

function extractMeta(html: string, property: string): string {
  const og = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)
  if (og?.[1]) return og[1]
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i').exec(html)
  return reverse?.[1] ?? ''
}

function extractMetaName(html: string, name: string): string {
  const m = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)
  if (m?.[1]) return m[1]
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i').exec(html)
  return reverse?.[1] ?? ''
}

function extractTitle(html: string): string {
  return /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim() ?? ''
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'invalid protocol' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SnowRealmBot/1.0; +https://insight.snowrealm.pet)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json({ error: `fetch failed: ${res.status}` }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'not html' }, { status: 422 })
    }

    const html = await res.text()

    const title = extractMeta(html, 'og:title') || extractTitle(html)
    const description = extractMeta(html, 'og:description') || extractMetaName(html, 'description')
    const image = extractMeta(html, 'og:image')
    const siteName = extractMeta(html, 'og:site_name') || parsedUrl.hostname

    return NextResponse.json({
      url: parsedUrl.toString(),
      title: title.slice(0, 200),
      description: description.slice(0, 400),
      image: image.slice(0, 500),
      siteName: siteName.slice(0, 100),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  process.env.R2_PUBLIC_URL,
  'pub-',         // Cloudflare R2 public URLs (pub-*.r2.dev)
  '.r2.dev',
  '.r2.cloudflarestorage.com',
  '.amazonaws.com',
  'media.line.me',
  'profile.line-scdn.net',
].filter(Boolean)

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return ALLOWED_HOSTS.some(h => h && (hostname.includes(h.replace('https://', '').replace('http://', '')) || url.includes(h)))
  } catch {
    return false
  }
}

/** GET /api/img-proxy?url=<encoded-url>
 *  Proxies external images server-side so the browser sees them as same-origin.
 *  Required for html2canvas to capture cross-origin images without CORS errors.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Security: only proxy known storage domains
  if (!isAllowed(url)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'SnowRealm-Insight-Engine/1.0' },
      // 30 second timeout
      signal: AbortSignal.timeout(30_000),
    })
    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Proxy failed', { status: 502 })
  }
}

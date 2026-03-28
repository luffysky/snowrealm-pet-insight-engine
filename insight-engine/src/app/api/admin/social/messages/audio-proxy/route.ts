import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DOMAINS = [
  process.env.R2_PUBLIC_URL ?? '',
  'r2.cloudflarestorage.com',
  'cloudflare.com',
]

/** Proxy audio files from R2 to avoid CORS / Cloudflare Bot Fight Mode blocking browser audio requests */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  // Security: only allow R2 / configured public URLs
  const isAllowed = ALLOWED_DOMAINS.some(d => d && url.startsWith(d)) ||
    url.match(/^https:\/\/[^/]+\.r2\.dev\//) ||
    url.match(/^https:\/\/[^/]+\.cloudflarestorage\.com\//)

  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Forward Range header for audio seeking support
  const rangeHeader = req.headers.get('range')
  const fetchHeaders: HeadersInit = { 'User-Agent': 'SnowRealm-AudioProxy/1.0' }
  if (rangeHeader) fetchHeaders['Range'] = rangeHeader

  try {
    const upstream = await fetch(url, { headers: fetchHeaders })
    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'audio/mpeg'
    const contentLength = upstream.headers.get('content-length')
    const contentRange = upstream.headers.get('content-range')
    const acceptRanges = upstream.headers.get('accept-ranges')

    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    }
    if (contentLength) responseHeaders['Content-Length'] = contentLength
    if (contentRange) responseHeaders['Content-Range'] = contentRange
    if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[AudioProxy]', err)
    return new NextResponse(null, { status: 502 })
  }
}

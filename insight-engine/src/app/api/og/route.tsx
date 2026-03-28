import { NextRequest, NextResponse } from 'next/server'
import satori from 'satori'
import sharp from 'sharp'

interface OgCardInput {
  postId: string
  authorName: string
  authorAvatar?: string
  imageUrl?: string
  title?: string
  content: string
  tags: string[]
  likesCount: number
  commentsCount: number
  dateStr: string
  postUrl: string
  imgPosX?: number
  imgPosY?: number
}

// Module-level font cache (persists across requests in the same server process)
let fontBuffer: ArrayBuffer | null = null

async function getCJKFont(): Promise<ArrayBuffer | null> {
  if (fontBuffer) return fontBuffer
  try {
    // Fetch Noto Sans TC (Traditional Chinese) subset from Google Fonts CDN
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      }
    )
    const css = await cssRes.text()
    // Extract first ttf/woff2 URL from CSS
    const match = /url\(([^)]+\.woff2[^)]*)\)/i.exec(css) || /url\(([^)]+)\)/i.exec(css)
    if (!match) return null
    const fontUrl = match[1].replace(/['"]/g, '')
    const fontRes = await fetch(fontUrl, { signal: AbortSignal.timeout(10000) })
    if (!fontRes.ok) return null
    fontBuffer = await fontRes.arrayBuffer()
    return fontBuffer
  } catch {
    return null
  }
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'SnowRealm-Insight-Engine/1.0' },
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: OgCardInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    authorName, authorAvatar, imageUrl, title, content,
    tags, likesCount, commentsCount, dateStr, postUrl,
    imgPosX = 50, imgPosY = 50,
    postId,
  } = body

  // Fetch all external assets server-side (no CORS restriction)
  const [avatarDataUrl, postImageDataUrl, font] = await Promise.all([
    authorAvatar ? fetchImageAsDataUrl(authorAvatar) : Promise.resolve(null),
    imageUrl ? fetchImageAsDataUrl(imageUrl) : Promise.resolve(null),
    getCJKFont(),
  ])

  const initials = (authorName ?? '?').slice(0, 2).toUpperCase()
  const excerpt = content.length > 120 ? content.slice(0, 120) + '…' : content
  const shortUrl = postUrl.replace(/^https?:\/\//, '')
  const tag = tags[0] ?? ''

  const fonts: Parameters<typeof satori>[1]['fonts'] = font
    ? [{ name: 'NotoSansTC', data: font, weight: 400, style: 'normal' }]
    : []

  const fontFamily = fonts.length ? 'NotoSansTC, sans-serif' : 'sans-serif'

  const cardElement = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 480,
        padding: '28px 28px 20px 28px',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        borderRadius: 24,
        gap: 16,
        fontFamily,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(168,85,247,0.4))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {avatarDataUrl
            ? <img src={avatarDataUrl} style={{ width: 40, height: 40, objectFit: 'cover' }} />
            : <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700, fontFamily }}>{initials}</span>
          }
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily }}>{authorName ?? '用戶'}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily }}>{dateStr}</span>
        </div>
      </div>

      {/* Post image */}
      {postImageDataUrl && (
        <div style={{
          width: '100%', height: 200, borderRadius: 12,
          overflow: 'hidden', display: 'flex',
        }}>
          <img
            src={postImageDataUrl}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: `${imgPosX}% ${imgPosY}%`,
            }}
          />
        </div>
      )}

      {/* Title */}
      {title && (
        <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.4, fontFamily }}>
          {title}
        </p>
      )}

      {/* Content */}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6, fontFamily }}>
        {excerpt}
      </p>

      {/* Stats */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        fontSize: 12, color: 'rgba(255,255,255,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12,
      }}>
        <span style={{ fontFamily }}>❤️ {likesCount}</span>
        <span style={{ fontFamily }}>💬 {commentsCount}</span>
        {tag && <span style={{ color: 'rgba(251,191,36,0.5)', fontFamily }}>#{tag}</span>}
      </div>

      {/* Branding */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8,
      }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily }}>SnowRealm Insight Engine</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily }}>{shortUrl}</span>
      </div>
    </div>
  )

  try {
    const svg = await satori(cardElement, {
      width: 480,
      height: 520,
      fonts,
    })

    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()

    return new NextResponse(png as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="post-${(postId ?? 'share').slice(0, 8)}.png"`,
      },
    })
  } catch (err) {
    console.error('[api/og] Satori/Sharp error:', err)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/socialEngine'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const tag = searchParams.get('tag') ?? undefined

  const posts = await getPosts({ type, limit, offset })

  const filtered = tag ? posts.filter(p => p.tags.includes(tag)) : posts

  return NextResponse.json({ posts: filtered, total: filtered.length })
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      type?: 'post' | 'article'
      title?: string
      content: string
      images?: { url: string; alt?: string }[]
      videoUrl?: string
      videoThumbnailUrl?: string
      tags?: string[]
    }

    if (!body.content?.trim()) {
      return NextResponse.json({ error: '內容不能為空' }, { status: 400 })
    }
    if (body.content.length > 5000) {
      return NextResponse.json({ error: '內容不能超過 5000 字' }, { status: 400 })
    }

    const tenantId = auth.tenants?.[0]?.tid ?? auth.tid ?? 'default'

    const post = await createPost({
      tenantId,
      userId: auth.sub,
      type: body.type ?? 'post',
      title: body.title,
      content: body.content,
      images: body.images ?? [],
      videoUrl: body.videoUrl,
      videoThumbnailUrl: body.videoThumbnailUrl,
      tags: body.tags ?? [],
      isPublic: true,
      status: 'published',
    })

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('[Create Post Error]', err)
    return NextResponse.json({ error: '發文失敗' }, { status: 500 })
  }
}

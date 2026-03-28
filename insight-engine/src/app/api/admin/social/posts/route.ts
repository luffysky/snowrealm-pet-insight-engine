import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getPosts, createPost } from '@/lib/socialEngine'

export async function GET(request: NextRequest) {
  const ctx = await getTenantContext()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? undefined
  const userId = searchParams.get('userId') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const posts = await getPosts({
    userId,
    viewerId: ctx.userId ?? undefined,
    type,
    limit,
    offset,
    adminView: true,
  })
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await request.json() as {
    type?: 'post' | 'article'
    title?: string
    content: string
    images?: { url: string; alt?: string }[]
    videoUrl?: string
    videoThumbnailUrl?: string
    tags?: string[]
    isPublic?: boolean
    status?: 'published' | 'draft'
  }

  if (!body.content?.trim()) return NextResponse.json({ error: '內容不能為空' }, { status: 400 })

  const post = await createPost({
    tenantId: ctx.tenantId ?? 'default',
    userId: ctx.userId,
    type: body.type ?? 'post',
    title: body.title,
    content: body.content,
    images: body.images,
    videoUrl: body.videoUrl,
    videoThumbnailUrl: body.videoThumbnailUrl,
    tags: body.tags,
    isPublic: body.isPublic,
    status: body.status,
  })

  return NextResponse.json({ post })
}

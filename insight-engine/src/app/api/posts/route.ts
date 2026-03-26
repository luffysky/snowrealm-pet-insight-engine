import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/socialEngine'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const tag = searchParams.get('tag') ?? undefined

  const posts = await getPosts({ type, limit, offset })

  // filter by tag if needed
  const filtered = tag ? posts.filter(p => p.tags.includes(tag)) : posts

  return NextResponse.json({ posts: filtered, total: filtered.length })
}

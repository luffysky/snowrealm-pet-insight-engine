import { NextRequest, NextResponse } from 'next/server'
import { getPost } from '@/lib/socialEngine'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  return NextResponse.json({ post })
}

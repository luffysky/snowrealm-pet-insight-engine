import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getPost, updatePost, deletePost } from '@/lib/socialEngine'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  const post = await getPost(id, ctx.userId ?? undefined)
  if (!post) return NextResponse.json({ error: '貼文不存在' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await request.json() as {
    title?: string
    content?: string
    images?: { url: string; alt?: string }[]
    tags?: string[]
    isPublic?: boolean
    status?: string
  }

  const post = await updatePost(id, ctx.userId, body)
  if (!post) return NextResponse.json({ error: '貼文不存在或無權限' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const ok = await deletePost(id, ctx.userId)
  if (!ok) return NextResponse.json({ error: '貼文不存在或無權限' }, { status: 404 })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getComments, createComment, toggleCommentLike } from '@/lib/socialEngine'

export async function GET(request: NextRequest) {
  const ctx = await getTenantContext()
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: '缺少 postId' }, { status: 400 })

  const comments = await getComments(postId, ctx.userId ?? undefined)
  return NextResponse.json({ comments })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await request.json() as { commentId?: string; action?: string }
  if (!body.commentId || body.action !== 'like') {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  const result = await toggleCommentLike(body.commentId, ctx.userId)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await request.json() as {
    postId: string
    content: string
    gifUrl?: string
    parentId?: string
  }

  if (!body.postId || (!body.content?.trim() && !body.gifUrl)) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  const comment = await createComment({
    postId: body.postId,
    userId: ctx.userId,
    content: body.content?.trim() || '',
    gifUrl: body.gifUrl,
    parentId: body.parentId,
  })

  return NextResponse.json({ comment })
}

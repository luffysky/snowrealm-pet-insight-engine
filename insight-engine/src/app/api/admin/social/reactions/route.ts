import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { toggleReaction } from '@/lib/socialEngine'

export async function POST(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { postId, type } = await request.json() as { postId: string; type: string }
  if (!postId) return NextResponse.json({ error: '缺少 postId' }, { status: 400 })

  const result = await toggleReaction(postId, ctx.userId, type ?? 'like')
  return NextResponse.json(result)
}

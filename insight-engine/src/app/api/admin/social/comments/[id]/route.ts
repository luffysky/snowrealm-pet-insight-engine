import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { deleteComment } from '@/lib/socialEngine'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const ok = await deleteComment(id, ctx.userId)
  if (!ok) return NextResponse.json({ error: '留言不存在或無權限' }, { status: 404 })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { sub: userId }
}

/** DELETE — 刪除單張貼圖 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string; stickerId: string }> }
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { packId, stickerId } = await params
  await execute(`DELETE FROM stickers WHERE id = $1 AND pack_id = $2`, [stickerId, packId])
  return NextResponse.json({ ok: true })
}

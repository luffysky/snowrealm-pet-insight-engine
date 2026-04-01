import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { getOwnerData } from '@/lib/ownerData'

async function requireOwner(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token).catch(() => null)
  if (!payload?.sub) return null
  const isUnlimited = await isUserPlatformUnlimited(payload.sub) || payload.role === 'super_admin'
  if (!isUnlimited) return null
  return payload
}

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req)
  if (!auth) return NextResponse.json({ error: '無權限' }, { status: 403 })

  const cmd = req.nextUrl.searchParams.get('cmd') ?? ''
  const text = await getOwnerData(cmd)
  return NextResponse.json({ text: text ?? '未知指令' })
}

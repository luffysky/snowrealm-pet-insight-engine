import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getProfile, updateProfile } from '@/lib/socialEngine'

export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })
  const profile = await getProfile(ctx.userId)
  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await request.json() as {
    displayName?: string
    avatarUrl?: string
    bio?: string
    websiteUrl?: string
    instagramHandle?: string
    twitterHandle?: string
    isProfilePublic?: boolean
  }

  const profile = await updateProfile(ctx.userId, body)
  return NextResponse.json({ profile })
}

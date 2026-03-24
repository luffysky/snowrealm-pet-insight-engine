import { NextResponse } from 'next/server'
import { getAiUsageStats } from '@/lib/aiService'
import { requireRole } from '@/lib/tenant'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId, userId } = roleCheck
  const stats = await getAiUsageStats(tenantId)
  const platformPartner = await isUserPlatformUnlimited(userId)
  return NextResponse.json({ ...stats, platformPartner })
}

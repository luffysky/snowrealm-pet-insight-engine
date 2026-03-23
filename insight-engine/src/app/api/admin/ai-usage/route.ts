import { NextResponse } from 'next/server'
import { getAiUsageStats } from '@/lib/aiService'
import { getTenantContext } from '@/lib/tenant'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

export async function GET(): Promise<NextResponse> {
  const { tenantId, userId } = await getTenantContext()
  const stats = await getAiUsageStats(tenantId)
  const platformPartner = await isUserPlatformUnlimited(userId)
  return NextResponse.json({ ...stats, platformPartner })
}

import { NextResponse } from 'next/server'
import { getAiUsageStats } from '@/lib/aiService'
import { getTenantContext } from '@/lib/tenant'

export async function GET(): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const stats = await getAiUsageStats(tenantId)
  return NextResponse.json(stats)
}

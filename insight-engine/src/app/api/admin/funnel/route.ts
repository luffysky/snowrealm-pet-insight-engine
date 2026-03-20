import { NextRequest, NextResponse } from 'next/server'
import { getFunnelStats } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const route = request.nextUrl.searchParams.get('route') || undefined
    const data = await getFunnelStats(tenantId, surveyId, route)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/funnel] Failed:', error)
    return NextResponse.json({ error: '取得漏斗分析失敗' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getFunnelStats } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const route = request.nextUrl.searchParams.get('route') || undefined
    const data = await getFunnelStats(tenantId, surveyId, route)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/funnel] Failed:', error)
    return NextResponse.json({ error: '取得漏斗分析失敗' }, { status: 500 })
  }
}

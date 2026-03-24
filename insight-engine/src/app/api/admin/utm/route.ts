import { NextRequest, NextResponse } from 'next/server'
import { getUtmAnalytics } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const analytics = await getUtmAnalytics(tenantId, surveyId)
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('[admin/utm] Failed:', error)
    return NextResponse.json(
      { error: '取得 UTM 分析失敗' },
      { status: 500 }
    )
  }
}

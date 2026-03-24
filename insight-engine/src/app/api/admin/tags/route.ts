import { NextRequest, NextResponse } from 'next/server'
import { getTagDistribution } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const distribution = await getTagDistribution(tenantId, surveyId)
    return NextResponse.json(distribution)
  } catch (error) {
    console.error('[admin/tags] Failed:', error)
    return NextResponse.json(
      { error: '取得標籤統計失敗' },
      { status: 500 }
    )
  }
}

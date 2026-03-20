import { NextRequest, NextResponse } from 'next/server'
import { getTagDistribution } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
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

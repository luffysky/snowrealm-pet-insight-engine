import { NextRequest, NextResponse } from 'next/server'
import { getQuestionStats } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const questionStats = await getQuestionStats(tenantId, surveyId)
    return NextResponse.json(questionStats)
  } catch (error) {
    console.error('[admin/questions] Failed:', error)
    return NextResponse.json(
      { error: '取得題目統計失敗' },
      { status: 500 }
    )
  }
}

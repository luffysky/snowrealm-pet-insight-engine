import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const stats = await getDashboardStats(tenantId, surveyId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/stats] Failed:', error)
    return NextResponse.json(
      { error: '取得統計資料失敗' },
      { status: 500 }
    )
  }
}

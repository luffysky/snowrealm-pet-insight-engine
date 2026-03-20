import { NextRequest, NextResponse } from 'next/server'
import { getResponsesCsv } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const csv = await getResponsesCsv(tenantId, surveyId)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="responses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[admin/export] Failed:', error)
    return NextResponse.json(
      { error: '匯出 CSV 失敗' },
      { status: 500 }
    )
  }
}

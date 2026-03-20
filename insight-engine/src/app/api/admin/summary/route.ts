import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const text = await generateSummary(tenantId, surveyId)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('[admin/summary] Failed:', error)
    return NextResponse.json({ error: '產生摘要失敗' }, { status: 500 })
  }
}

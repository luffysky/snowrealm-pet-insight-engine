import { NextRequest, NextResponse } from 'next/server'
import { listVariantGroups, getVariantGroupStats } from '@/lib/surveyRepo'
import { getTenantContext } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const group = request.nextUrl.searchParams.get('group')

    if (group) {
      const stats = await getVariantGroupStats(group, tenantId)
      return NextResponse.json(stats)
    }

    const groups = await listVariantGroups(tenantId)
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('[admin/ab] Failed:', error)
    return NextResponse.json({ error: '取得 A/B 比較失敗' }, { status: 500 })
  }
}

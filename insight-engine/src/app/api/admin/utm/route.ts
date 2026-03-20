import { NextResponse } from 'next/server'
import { getUtmAnalytics } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const analytics = await getUtmAnalytics(tenantId)
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('[admin/utm] Failed:', error)
    return NextResponse.json(
      { error: '取得 UTM 分析失敗' },
      { status: 500 }
    )
  }
}

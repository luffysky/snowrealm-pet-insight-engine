import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'

export async function GET(): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const stats = await getDashboardStats(tenantId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/stats] Failed:', error)
    return NextResponse.json(
      { error: '取得統計資料失敗' },
      { status: 500 }
    )
  }
}

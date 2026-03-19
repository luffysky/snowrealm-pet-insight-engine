import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/stats] Failed:', error)
    return NextResponse.json(
      { error: '取得統計資料失敗' },
      { status: 500 }
    )
  }
}

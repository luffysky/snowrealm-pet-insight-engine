import { NextResponse } from 'next/server'
import { getUtmAnalytics } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const analytics = await getUtmAnalytics()
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('[admin/utm] Failed:', error)
    return NextResponse.json(
      { error: '取得 UTM 分析失敗' },
      { status: 500 }
    )
  }
}

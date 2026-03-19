import { NextResponse } from 'next/server'
import { getFunnelStats } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getFunnelStats()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/funnel] Failed:', error)
    return NextResponse.json({ error: '取得漏斗分析失敗' }, { status: 500 })
  }
}

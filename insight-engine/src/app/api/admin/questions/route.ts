import { NextResponse } from 'next/server'
import { getQuestionStats } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const questionStats = await getQuestionStats()
    return NextResponse.json(questionStats)
  } catch (error) {
    console.error('[admin/questions] Failed:', error)
    return NextResponse.json(
      { error: '取得題目統計失敗' },
      { status: 500 }
    )
  }
}

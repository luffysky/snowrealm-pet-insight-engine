import { NextResponse } from 'next/server'
import { generateSummary } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const text = await generateSummary()
    return NextResponse.json({ text })
  } catch (error) {
    console.error('[admin/summary] Failed:', error)
    return NextResponse.json({ error: '產生摘要失敗' }, { status: 500 })
  }
}

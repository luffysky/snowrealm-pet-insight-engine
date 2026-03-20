import { NextResponse } from 'next/server'
import { getAiUsageStats } from '@/lib/aiService'

export async function GET(): Promise<NextResponse> {
  const stats = await getAiUsageStats('default')
  return NextResponse.json(stats)
}

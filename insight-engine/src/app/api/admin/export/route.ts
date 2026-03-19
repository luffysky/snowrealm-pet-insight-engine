import { NextResponse } from 'next/server'
import { getResponsesCsv } from '@/lib/stats'

export async function GET(): Promise<NextResponse> {
  try {
    const csv = await getResponsesCsv()
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="responses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[admin/export] Failed:', error)
    return NextResponse.json(
      { error: '匯出 CSV 失敗' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { listVariantGroups, getVariantGroupStats } from '@/lib/surveyRepo'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const group = request.nextUrl.searchParams.get('group')

    if (group) {
      const stats = await getVariantGroupStats(group)
      return NextResponse.json(stats)
    }

    // 回傳所有 variant group 名稱
    const groups = await listVariantGroups()
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('[admin/ab] Failed:', error)
    return NextResponse.json({ error: '取得 A/B 比較失敗' }, { status: 500 })
  }
}

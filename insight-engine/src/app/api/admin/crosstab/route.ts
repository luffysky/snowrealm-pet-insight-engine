import { NextRequest, NextResponse } from 'next/server'
import { getCrossTabData } from '@/lib/stats'
import { requireRole } from '@/lib/tenant'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl
    const a = searchParams.get('a')
    const b = searchParams.get('b')

    if (!a || !b) {
      return NextResponse.json(
        { error: '需要 a 和 b 參數（題目 key）' },
        { status: 400 }
      )
    }

    // 驗證 question key 格式（防注入）
    const keyPattern = /^[a-z0-9_-]+$/i
    if (!keyPattern.test(a) || !keyPattern.test(b)) {
      return NextResponse.json({ error: '無效的題目 key' }, { status: 400 })
    }

    const roleCheck = await requireRole('viewer')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck
    const surveyId = searchParams.get('surveyId') || undefined
    const data = await getCrossTabData(a, b, tenantId, surveyId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/crosstab] Failed:', error)
    return NextResponse.json({ error: '取得交叉分析失敗' }, { status: 500 })
  }
}

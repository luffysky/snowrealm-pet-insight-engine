import { NextRequest, NextResponse } from 'next/server'
import { getResponseDetail } from '@/lib/stats'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '無效的 ID 格式' }, { status: 400 })
  }

  try {
    const detail = await getResponseDetail(id)

    if (!detail) {
      return NextResponse.json({ error: '找不到該填答' }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    console.error('[admin/responses/:id] Failed:', error)
    return NextResponse.json(
      { error: '取得填答詳情失敗' },
      { status: 500 }
    )
  }
}

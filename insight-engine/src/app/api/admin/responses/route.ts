import { NextRequest, NextResponse } from 'next/server'
import { getResponseList } from '@/lib/stats'
import { DEFAULT_PAGE_SIZE } from '@/constants'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10))
    )

    const status = searchParams.get('status') || undefined
    const source = searchParams.get('source') || undefined

    const result = await getResponseList(page, pageSize, { status, source })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/responses] Failed:', error)
    return NextResponse.json(
      { error: '取得填答列表失敗' },
      { status: 500 }
    )
  }
}

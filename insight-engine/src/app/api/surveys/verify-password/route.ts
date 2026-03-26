import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { slug, password } = (await request.json()) as { slug?: string; password?: string }
    if (!slug || !password) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const survey = await queryOne<{ access_password: string | null }>(
      `SELECT access_password FROM surveys WHERE slug = $1 AND status = 'published'`,
      [slug]
    )

    if (!survey) {
      return NextResponse.json({ error: '問卷不存在' }, { status: 404 })
    }

    if (!survey.access_password) {
      return NextResponse.json({ valid: true })
    }

    const valid = survey.access_password === password
    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

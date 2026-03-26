import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getOrCreateReferralCode, validateReferralCode, getReferralInfo } from '@/lib/referralEngine'

export const dynamic = 'force-dynamic'

/** GET /api/referral — 取得我的邀請碼 + 推薦統計
 *  ?code=XXX — 公開驗證邀請碼（不需登入）
 */
export async function GET(request: NextRequest) {
  // 公開邀請碼驗證（不需登入）
  const code = new URL(request.url).searchParams.get('code')
  if (code) {
    const result = await validateReferralCode(code)
    return NextResponse.json({ ...result, code: code.toUpperCase() })
  }

  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const [myCode, info] = await Promise.all([
    getOrCreateReferralCode(ctx.userId),
    getReferralInfo(ctx.userId),
  ])

  const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/invite/${myCode}`

  return NextResponse.json({ code: myCode, referralUrl, info })
}

/** POST /api/referral — 驗證邀請碼（供前端即時查詢） */
export async function POST(req: Request) {
  const body = await req.json() as { code: string }
  if (!body.code) return NextResponse.json({ valid: false })

  const result = await validateReferralCode(body.code)
  return NextResponse.json(result)
}

import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getOrCreateReferralCode, validateReferralCode, getReferralInfo } from '@/lib/referralEngine'

/** GET /api/referral — 取得我的邀請碼 + 推薦統計 */
export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const [code, info] = await Promise.all([
    getOrCreateReferralCode(ctx.userId),
    getReferralInfo(ctx.userId),
  ])

  const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/register?ref=${code}`

  return NextResponse.json({ code, referralUrl, info })
}

/** POST /api/referral/validate — 驗證邀請碼（供前端即時查詢） */
export async function POST(req: Request) {
  const body = await req.json() as { code: string }
  if (!body.code) return NextResponse.json({ valid: false })

  const result = await validateReferralCode(body.code)
  return NextResponse.json(result)
}

import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { checkAdQuota, recordAdView } from '@/lib/adEngine'

const AD_REWARD = 2

/** GET /api/ad-view — 查詢今日廣告配額 */
export async function GET() {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }
  const quota = await checkAdQuota(ctx.userId)
  return NextResponse.json({ ...quota, reward: AD_REWARD })
}

/** POST /api/ad-view — 記錄廣告觀看，發放 Z幣 */
export async function POST() {
  const ctx = await getTenantContext()
  if (!ctx.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const ok = await recordAdView(ctx.userId, 'zcoin_reward', AD_REWARD)
  if (!ok) {
    return NextResponse.json({ error: '今日廣告次數已達上限' }, { status: 400 })
  }

  return NextResponse.json({ success: true, earned: AD_REWARD })
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAndDecryptNotify } from '@/lib/newebpay'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const tradeInfo = formData.get('TradeInfo') as string
    const tradeSha = formData.get('TradeSha') as string

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'
    let redirectPath = '/insight-admin/subscription'

    if (tradeInfo && tradeSha) {
      const result = verifyAndDecryptNotify(tradeInfo, tradeSha)
      if (result && result.Status === 'SUCCESS') {
        redirectPath += '?status=success'
      } else {
        redirectPath += '?status=failed'
      }
    }

    return NextResponse.redirect(new URL(redirectPath, baseUrl))
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'
    return NextResponse.redirect(new URL('/insight-admin/subscription?status=error', baseUrl))
  }
}

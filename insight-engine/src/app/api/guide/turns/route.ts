import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { queryOne } from '@/lib/db'
import { getBalance } from '@/lib/zcoinEngine'
import { FREE_DAILY_LIMIT } from '../chat/route'

export const runtime = 'nodejs'

function getUserKey(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  return `ip:${ip}`
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value ?? null
  let userId: string | null = null
  let payload: Awaited<ReturnType<typeof verifyToken>> = null
  if (token) {
    payload = await verifyToken(token)
    userId = payload?.sub ?? null
  }

  // 每次都查 DB 確認特權狀態
  const isUnlimited = await isUserPlatformUnlimited(userId)
  const isAdmin = !!(payload?.role && ['super_admin', 'admin'].includes(payload.role))
  if (isUnlimited) {
    return NextResponse.json({ isUnlimited: true, freeRemaining: null, purchasedCredits: null, zcoinBalance: null, isAdmin })
  }

  const userKey = getUserKey(req, userId)
  const today = new Date().toISOString().slice(0, 10)

  try {
    const [rateRow, creditRow] = await Promise.all([
      queryOne<{ free_used: number }>(
        `SELECT free_used FROM guide_chat_rate WHERE user_key = $1 AND date = $2`,
        [userKey, today]
      ),
      queryOne<{ credits: number }>(
        `SELECT credits FROM guide_chat_credits WHERE user_key = $1`,
        [userKey]
      ),
    ])

    const freeUsed = rateRow?.free_used ?? 0
    const freeRemaining = Math.max(0, FREE_DAILY_LIMIT - freeUsed)
    const purchasedCredits = creditRow?.credits ?? 0

    const zcoinBalance = userId ? await getBalance({ userId }) : 0

    return NextResponse.json({
      isUnlimited: false,
      freeRemaining,
      purchasedCredits,
      zcoinBalance,
      isLoggedIn: !!userId,
      isAdmin,
    })
  } catch {
    return NextResponse.json({
      isUnlimited: false,
      freeRemaining: FREE_DAILY_LIMIT,
      purchasedCredits: 0,
      zcoinBalance: 0,
      isLoggedIn: !!userId,
      isAdmin,
    })
  }
}

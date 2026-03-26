/**
 * 裂變推薦引擎
 * 推薦人：被推薦人升級後，推薦人每月獲得 10% 分潤（最多 12 個月）
 * 被推薦人：使用邀請碼 → 30 天免費試用
 */
import { queryOne, execute } from './db'
import { randomBytes } from 'crypto'

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(length)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

// ===== 型別 =====

interface ReferralRow extends Record<string, unknown> {
  id: string
  referrer_id: string
  referred_id: string | null
  referral_code: string
  status: string
  commission_rate: number
  created_at: string
}

// ===== 邀請碼生成 =====

/** 為用戶生成或取得邀請碼 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  // 先查現有
  const existing = await queryOne<{ referral_code: string }>(
    `SELECT referral_code FROM admin_users WHERE id = $1 AND referral_code IS NOT NULL`,
    [userId]
  )
  if (existing?.referral_code) return existing.referral_code

  // 生成新的（8 碼英數）
  const code = generateCode(8)
  await execute(
    `UPDATE admin_users SET referral_code = $1 WHERE id = $2`,
    [code, userId]
  )
  return code
}

/** 驗證邀請碼是否有效 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean
  referrerId?: string
  referrerName?: string
}> {
  const row = await queryOne<{ id: string; username: string }>(
    `SELECT id, username FROM admin_users WHERE referral_code = $1`,
    [code.toUpperCase()]
  )
  if (!row) return { valid: false }
  return { valid: true, referrerId: row.id, referrerName: row.username }
}

// ===== 推薦關係建立 =====

/** 新用戶使用邀請碼完成註冊後建立推薦關係 */
export async function createReferral(params: {
  referrerId: string
  referredId: string
  referralCode: string
}): Promise<void> {
  await execute(
    `INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
     VALUES ($1, $2, $3, 'pending')
     ON CONFLICT (referral_code) DO NOTHING`,
    [params.referrerId, params.referredId, params.referralCode]
  )

  // 在 admin_users 記錄被邀請資訊
  await execute(
    `UPDATE admin_users SET referred_by = $1 WHERE id = $2`,
    [params.referralCode, params.referredId]
  )
}

/** 取得推薦人資訊（用於顯示「你由 X 邀請」） */
export async function getReferralInfo(userId: string): Promise<{
  referredBy?: string
  referrerName?: string
  referrals: { username: string; status: string; createdAt: string }[]
} | null> {
  const user = await queryOne<{ referred_by: string | null }>(
    `SELECT referred_by FROM admin_users WHERE id = $1`,
    [userId]
  )
  if (!user) return null

  let referrerName: string | undefined
  if (user.referred_by) {
    const referrer = await queryOne<{ username: string }>(
      `SELECT username FROM admin_users WHERE referral_code = $1`,
      [user.referred_by]
    )
    referrerName = referrer?.username
  }

  const referredUsers = await queryOne<{ rows: unknown[] }>(
    `SELECT au.username, r.status, r.created_at
     FROM referrals r JOIN admin_users au ON r.referred_id = au.id
     WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  ).catch(() => null)

  const rawRows = (referredUsers as unknown as { username: string; status: string; created_at: string }[]) ?? []
  return {
    referredBy: user.referred_by ?? undefined,
    referrerName,
    referrals: rawRows.map(r => ({ username: r.username, status: r.status, createdAt: r.created_at })),
  }
}

/** 完成推薦（被推薦人升級付費後呼叫） */
export async function completeReferral(referredId: string): Promise<void> {
  await execute(
    `UPDATE referrals SET status = 'completed', completed_at = NOW()
     WHERE referred_id = $1 AND status = 'pending'`,
    [referredId]
  )
}

/**
 * 廣告追蹤引擎 — 每位用戶每日最多觀看 10 則廣告，午夜重置
 * 觀看廣告可獲得 Z幣獎勵
 *
 * DB Migration（需手動在 Supabase 執行）：
 *
 * CREATE TABLE IF NOT EXISTS ad_views (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL,
 *   viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   reward_type TEXT NOT NULL,
 *   reward_amount INT NOT NULL DEFAULT 0
 * );
 *
 * CREATE INDEX idx_ad_views_user_date
 *   ON ad_views (user_id, viewed_at DESC);
 */

import { query, queryOne, execute } from './db'
import { earnZcoin } from './zcoinEngine'

// ===== 常數 =====

const AD_DAILY_LIMIT = 10

interface AdViewRow extends Record<string, unknown> {
  id: string
  user_id: string
  viewed_at: string
  reward_type: string
  reward_amount: number
}

interface DailyCountRow extends Record<string, unknown> {
  count: string
}

interface TotalStatsRow extends Record<string, unknown> {
  total_count: string
  total_earned: string
}

// ===== 配額查詢 =====

/**
 * 查詢用戶今日廣告觀看配額
 * 今日 = 當天午夜 00:00 起（UTC+8 轉換由 DB timezone 決定）
 */
export async function checkAdQuota(userId: string): Promise<{
  canWatch: boolean
  todayCount: number
  limit: number
}> {
  const row = await queryOne<DailyCountRow>(
    `SELECT COUNT(*) AS count
     FROM ad_views
     WHERE user_id = $1
       AND viewed_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei'`,
    [userId]
  )

  const todayCount = parseInt(row?.count ?? '0', 10)

  return {
    canWatch: todayCount < AD_DAILY_LIMIT,
    todayCount,
    limit: AD_DAILY_LIMIT,
  }
}

// ===== 記錄觀看 =====

/**
 * 記錄一次廣告觀看並發放 Z幣獎勵
 * 廣告觀看本身由前端模擬（3 秒 loading spinner），後端只負責紀錄與發幣
 * 若今日已達上限則回傳 false
 */
export async function recordAdView(
  userId: string,
  rewardType: string,
  rewardAmount: number
): Promise<boolean> {
  // 先檢查配額
  const quota = await checkAdQuota(userId)
  if (!quota.canWatch) {
    return false
  }

  // 寫入觀看紀錄
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO ad_views (user_id, reward_type, reward_amount)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, rewardType, rewardAmount]
  )

  if (!inserted?.id) {
    return false
  }

  // 發放 Z幣獎勵（只有獎勵金額 > 0 才發）
  if (rewardAmount > 0) {
    await earnZcoin({
      userId,
      amount: rewardAmount,
      reason: 'survey_complete', // 使用最接近的既有 reason 類型
      referenceId: inserted.id,
    })
  }

  return true
}

// ===== 統計 =====

/**
 * 取得用戶廣告觀看統計
 */
export async function getAdStats(userId: string): Promise<{
  todayCount: number
  totalCount: number
  totalEarned: number
}> {
  const [quota, totals] = await Promise.all([
    checkAdQuota(userId),
    queryOne<TotalStatsRow>(
      `SELECT COUNT(*) AS total_count, COALESCE(SUM(reward_amount), 0) AS total_earned
       FROM ad_views
       WHERE user_id = $1`,
      [userId]
    ),
  ])

  return {
    todayCount: quota.todayCount,
    totalCount: parseInt(totals?.total_count ?? '0', 10),
    totalEarned: parseInt(totals?.total_earned ?? '0', 10),
  }
}

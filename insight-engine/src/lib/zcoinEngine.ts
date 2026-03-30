/**
 * Z幣引擎 — 填答者/用戶的虛擬貨幣系統
 * 取得：填問卷 +1 / 分享 +5 / 邀請 +10 / 連續登入 +2 / 里程碑 +50
 * 花費：解鎖模板 -10 / AI 單次 -20 / 裝飾 -5~-15 / 特殊主題 -30
 */
import { queryOne, query, execute } from './db'

// ===== 常數 =====

export const ZCOIN_EARN = {
  SURVEY_COMPLETE: 1,
  SHARE: 5,
  INVITE: 10,
  DAILY_LOGIN: 2,
  MILESTONE_100: 50,
} as const

export const ZCOIN_SPEND = {
  UNLOCK_TEMPLATE: 10,
  AI_USAGE: 20,
  DECORATION_S: 5,
  DECORATION_M: 10,
  DECORATION_L: 15,
  SPECIAL_THEME: 30,
} as const

type EarnReason = 'survey_complete' | 'share' | 'invite' | 'daily_login' | 'milestone' | 'recharge'
type SpendReason = 'unlock_template' | 'ai_usage' | 'decoration' | 'special_theme' | 'guide_chat'
type TxReason = EarnReason | SpendReason

interface WalletRow extends Record<string, unknown> {
  id: string
  user_id: string | null
  line_user_id: string | null
  tenant_id: string
  balance: number
  total_earned: number
  total_spent: number
}

// ===== 錢包操作 =====

/** 取得或建立錢包 */
export async function getOrCreateWallet(params: {
  userId?: string
  lineUserId?: string
  tenantId?: string
}): Promise<WalletRow> {
  const tenantId = params.tenantId ?? 'default'

  // 查詢已有錢包
  let wallet: WalletRow | null = null
  if (params.userId) {
    wallet = await queryOne<WalletRow>(
      `SELECT * FROM zcoin_wallets WHERE user_id = $1 AND tenant_id = $2`,
      [params.userId, tenantId]
    )
  } else if (params.lineUserId) {
    wallet = await queryOne<WalletRow>(
      `SELECT * FROM zcoin_wallets WHERE line_user_id = $1 AND tenant_id = $2`,
      [params.lineUserId, tenantId]
    )
  }

  if (wallet) return wallet

  // 建立新錢包
  const created = await queryOne<WalletRow>(
    `INSERT INTO zcoin_wallets (user_id, line_user_id, tenant_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [params.userId ?? null, params.lineUserId ?? null, tenantId]
  )
  return created!
}

/** 取得錢包餘額 */
export async function getBalance(params: {
  userId?: string
  lineUserId?: string
  tenantId?: string
}): Promise<number> {
  const wallet = await getOrCreateWallet(params)
  return wallet.balance
}

// ===== 交易 =====

/** 賺取 Z幣 */
export async function earnZcoin(params: {
  userId?: string
  lineUserId?: string
  tenantId?: string
  amount: number
  reason: EarnReason
  referenceId?: string
}): Promise<{ newBalance: number }> {
  const wallet = await getOrCreateWallet(params)

  await execute(
    `UPDATE zcoin_wallets
     SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
     WHERE id = $2`,
    [params.amount, wallet.id]
  )

  await execute(
    `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
     VALUES ($1, $2, 'earn', $3, $4)`,
    [wallet.id, params.amount, params.reason, params.referenceId ?? null]
  )

  return { newBalance: wallet.balance + params.amount }
}

/** 花費 Z幣（如果餘額不足回傳 false） */
export async function spendZcoin(params: {
  userId?: string
  lineUserId?: string
  tenantId?: string
  amount: number
  reason: SpendReason
  referenceId?: string
}): Promise<{ ok: boolean; newBalance?: number; error?: string }> {
  const wallet = await getOrCreateWallet(params)

  if (wallet.balance < params.amount) {
    return { ok: false, error: `Z幣不足（現有 ${wallet.balance}，需要 ${params.amount}）` }
  }

  await execute(
    `UPDATE zcoin_wallets
     SET balance = balance - $1, total_spent = total_spent + $1, updated_at = NOW()
     WHERE id = $2`,
    [params.amount, wallet.id]
  )

  await execute(
    `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason, reference_id)
     VALUES ($1, $2, 'spend', $3, $4)`,
    [wallet.id, -params.amount, params.reason, params.referenceId ?? null]
  )

  return { ok: true, newBalance: wallet.balance - params.amount }
}

// ===== 交易歷史 =====

interface TxRow extends Record<string, unknown> {
  id: string
  amount: number
  type: string
  reason: TxReason
  reference_id: string | null
  created_at: string
}

export async function getTransactionHistory(params: {
  userId?: string
  lineUserId?: string
  tenantId?: string
  limit?: number
}): Promise<TxRow[]> {
  const wallet = await getOrCreateWallet(params)
  return query<TxRow>(
    `SELECT * FROM zcoin_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [wallet.id, params.limit ?? 20]
  )
}

// ===== 里程碑獎勵（在 submit 後呼叫） =====

/** 填答後發 Z幣（+1）。到達 100 筆里程碑額外 +50 */
export async function rewardSurveyComplete(params: {
  lineUserId?: string
  tenantId?: string
  responseCount: number
  referenceId?: string
}): Promise<void> {
  await earnZcoin({
    lineUserId: params.lineUserId,
    tenantId: params.tenantId,
    amount: ZCOIN_EARN.SURVEY_COMPLETE,
    reason: 'survey_complete',
    referenceId: params.referenceId,
  })

  if (params.responseCount === 100) {
    await earnZcoin({
      lineUserId: params.lineUserId,
      tenantId: params.tenantId,
      amount: ZCOIN_EARN.MILESTONE_100,
      reason: 'milestone',
      referenceId: params.referenceId,
    })
  }
}

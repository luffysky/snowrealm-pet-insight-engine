import { queryOne, query, execute } from '@/lib/db'
import { decryptApiKey } from '@/lib/aiCrypto'
import { randomUUID } from 'crypto'

const FREE_GENERATE_LIMIT = 1
const FREE_REGENERATE_LIMIT = 1

export interface AiKeyResult {
  provider: string
  model: string
  apiKey: string
  keySource: 'platform_key' | 'own_key'
}

/** 取得可用的 AI API Key（優先使用使用者自己的 key，否則用平台 key） */
export async function getActiveAiKey(tenantId = 'default'): Promise<AiKeyResult | null> {
  // 優先找 is_primary + is_active 的
  const row = await queryOne<{
    provider: string
    default_model: string
    encrypted_api_key: string
    encryption_iv: string
    encryption_tag: string
  }>(
    `SELECT provider, default_model, encrypted_api_key, encryption_iv, encryption_tag
     FROM ai_provider_configs
     WHERE tenant_id = $1 AND is_active = true
     ORDER BY is_primary DESC, created_at ASC
     LIMIT 1`,
    [tenantId]
  )

  if (!row || !row.encrypted_api_key) return null

  const apiKey = decryptApiKey({
    encrypted: row.encrypted_api_key,
    iv: row.encryption_iv,
    tag: row.encryption_tag,
  })

  return {
    provider: row.provider,
    model: row.default_model,
    apiKey,
    keySource: 'own_key',
  }
}

/** 取得平台 key（.env.local 的 OPENAI_API_KEY）用於免費額度 */
export function getPlatformKey(): AiKeyResult | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: key,
    keySource: 'platform_key',
  }
}

/** 檢查免費額度是否還有 */
export async function checkFreeQuota(
  tenantId: string,
  action: 'generate' | 'regenerate'
): Promise<boolean> {
  const limit = action === 'generate' ? FREE_GENERATE_LIMIT : FREE_REGENERATE_LIMIT

  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM ai_usage_logs
     WHERE tenant_id = $1 AND action = $2 AND is_free = true`,
    [tenantId, action]
  )

  return Number(row?.count ?? 0) < limit
}

/** 記錄 AI 使用紀錄 */
export async function logAiUsage(params: {
  tenantId?: string
  action: 'generate' | 'regenerate'
  keySource: 'platform_key' | 'own_key'
  provider: string
  model: string
  surveyId?: string
  promptTokens?: number
  completionTokens?: number
  isFree: boolean
}): Promise<void> {
  await execute(
    `INSERT INTO ai_usage_logs
       (id, tenant_id, action, key_source, provider, model, survey_id, prompt_tokens, completion_tokens, is_free)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      randomUUID(),
      params.tenantId ?? 'default',
      params.action,
      params.keySource,
      params.provider,
      params.model,
      params.surveyId ?? null,
      params.promptTokens ?? 0,
      params.completionTokens ?? 0,
      params.isFree,
    ]
  )
}

/** 取得 AI 使用統計 */
export async function getAiUsageStats(tenantId = 'default') {
  const rows = await query<{
    action: string
    key_source: string
    count: string
    total_prompt: string
    total_completion: string
  }>(
    `SELECT action, key_source,
            COUNT(*) as count,
            COALESCE(SUM(prompt_tokens), 0) as total_prompt,
            COALESCE(SUM(completion_tokens), 0) as total_completion
     FROM ai_usage_logs
     WHERE tenant_id = $1
     GROUP BY action, key_source
     ORDER BY action, key_source`,
    [tenantId]
  )

  const freeRow = await queryOne<{ gen: string; regen: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE action = 'generate' AND is_free = true) as gen,
       COUNT(*) FILTER (WHERE action = 'regenerate' AND is_free = true) as regen
     FROM ai_usage_logs WHERE tenant_id = $1`,
    [tenantId]
  )

  return {
    usage: rows.map((r) => ({
      action: r.action,
      keySource: r.key_source,
      count: Number(r.count),
      totalPromptTokens: Number(r.total_prompt),
      totalCompletionTokens: Number(r.total_completion),
    })),
    freeQuota: {
      generate: { used: Number(freeRow?.gen ?? 0), limit: FREE_GENERATE_LIMIT },
      regenerate: { used: Number(freeRow?.regen ?? 0), limit: FREE_REGENERATE_LIMIT },
    },
  }
}

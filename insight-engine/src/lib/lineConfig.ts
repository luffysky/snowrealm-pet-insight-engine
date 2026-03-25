/**
 * LINE 環境設定 — DB 優先 + ENV 備援 + 記憶體快取
 * 敏感值以 AES-256-GCM 加密存儲（同 aiCrypto 模式）
 * 
 * 前端永遠看不到明文 — 只有 server side 使用
 */
import { queryOne, query } from '@/lib/db'
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/aiCrypto'

// ===== Config Key 定義 =====

export const LINE_CONFIG_KEYS = {
  INSIGHT_CHANNEL_ACCESS_TOKEN: { envKey: 'LINE_INSIGHT_CHANNEL_ACCESS_TOKEN', secret: true, label: 'Channel Access Token', group: 'insight' as const },
  INSIGHT_CHANNEL_SECRET: { envKey: 'LINE_INSIGHT_CHANNEL_SECRET', secret: true, label: 'Channel Secret', group: 'insight' as const },
  INSIGHT_CHANNEL_ID: { envKey: 'LINE_INSIGHT_CHANNEL_ID', secret: false, label: 'Channel ID', group: 'insight' as const },
  INSIGHT_LINE_ID: { envKey: 'LINE_INSIGHT_ID', secret: false, label: 'LINE ID', group: 'insight' as const },
  OFFICIAL_CHANNEL_ACCESS_TOKEN: { envKey: 'LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN', secret: true, label: 'Channel Access Token', group: 'official' as const },
  OFFICIAL_CHANNEL_SECRET: { envKey: 'LINE_OFFICIAL_CHANNEL_SECRET', secret: true, label: 'Channel Secret', group: 'official' as const },
  OFFICIAL_CHANNEL_ID: { envKey: 'LINE_OFFICIAL_CHANNEL_ID', secret: false, label: 'Channel ID', group: 'official' as const },
  OFFICIAL_LINE_ID: { envKey: 'LINE_OFFICIAL_ID', secret: false, label: 'LINE ID', group: 'official' as const },
  ADMIN_USER_ID: { envKey: 'LINE_YOUR_USER_ID', secret: false, label: '管理員 LINE User ID', group: 'admin' as const },
  POST_SURVEY_RICH_MENU_ID: {
    envKey: 'POST_SURVEY_RICH_MENU_ID',
    secret: false,
    label: '填答完成後 Rich Menu ID',
    group: 'official' as const,
    description: '用戶填完問卷後切換的 Rich Menu（格式：richmenu-xxx）',
  },
  DEFAULT_RICH_MENU_ID: {
    envKey: 'DEFAULT_RICH_MENU_ID',
    secret: false,
    label: '預設 Rich Menu ID',
    group: 'official' as const,
    description: '新好友加入時的預設 Rich Menu',
  },
  LIFF_ID: {
    envKey: 'NEXT_PUBLIC_LIFF_ID',
    secret: false,
    label: 'LIFF ID',
    group: 'official' as const,
    description: 'LIFF 應用程式 ID（用於 LINE 內嵌頁面）',
  },
  LINE_FRIEND_URL: {
    envKey: 'NEXT_PUBLIC_LINE_FRIEND_URL',
    secret: false,
    label: 'LINE 加好友連結',
    group: 'official' as const,
    description: '例：https://line.me/R/ti/p/@474iwlht',
  },
} as const

export type LineConfigKey = keyof typeof LINE_CONFIG_KEYS

// ===== 記憶體快取 =====

interface CacheEntry { value: string; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 分鐘

function getCached(key: string): string | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined }
  return entry.value
}

function setCache(key: string, value: string): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL })
}

/** 清除所有快取（寫入後呼叫） */
export function clearLineConfigCache(): void {
  cache.clear()
}

// ===== DB Row 型別 =====

interface LineConfigRow extends Record<string, unknown> {
  id: string
  config_key: string
  config_value: string
  is_secret: boolean
  encryption_iv: string | null
  encryption_tag: string | null
  description: string
  updated_at: string
}

// ===== 核心 Getter（server only） =====

/**
 * 取得 LINE 設定值
 * 優先：DB line_configs → process.env → null
 * 敏感值自動解密
 */
export async function getLineConfig(key: LineConfigKey, tenantId = 'default'): Promise<string | null> {
  const cacheKey = `${tenantId}:${key}`
  const cached = getCached(cacheKey)
  if (cached !== undefined) return cached

  try {
    const row = await queryOne<LineConfigRow>(
      `SELECT * FROM line_configs WHERE tenant_id = $1 AND config_key = $2`,
      [tenantId, key]
    )

    if (row?.config_value) {
      let value: string
      if (row.is_secret && row.encryption_iv && row.encryption_tag) {
        value = decryptApiKey({
          encrypted: row.config_value,
          iv: row.encryption_iv,
          tag: row.encryption_tag,
        })
      } else {
        value = row.config_value
      }
      setCache(cacheKey, value)
      return value
    }
  } catch {
    // DB 查詢失敗時 fallback 到 env
  }

  // ENV fallback
  const def = LINE_CONFIG_KEYS[key]
  const envVal = process.env[def.envKey] ?? null
  if (envVal) setCache(cacheKey, envVal)
  return envVal
}

// ===== Admin 用：列出所有設定（遮罩敏感值） =====

export interface LineConfigInfo {
  key: LineConfigKey
  label: string
  group: 'insight' | 'official' | 'admin'
  isSecret: boolean
  source: 'db' | 'env' | 'none'
  maskedValue: string | null
  description: string
}

/** 列出所有 LINE 設定的狀態（前端安全 — 遮罩敏感值） */
export async function listLineConfigs(tenantId = 'default'): Promise<LineConfigInfo[]> {
  const dbRows = await query<LineConfigRow>(
    `SELECT * FROM line_configs WHERE tenant_id = $1`,
    [tenantId]
  ).catch(() => [] as LineConfigRow[])

  const dbMap = new Map(dbRows.map((r) => [r.config_key, r]))

  const result: LineConfigInfo[] = []
  for (const [key, def] of Object.entries(LINE_CONFIG_KEYS) as [LineConfigKey, typeof LINE_CONFIG_KEYS[LineConfigKey]][]) {
    const group = def.group ?? (key.startsWith('INSIGHT_') ? 'insight'
      : key.startsWith('OFFICIAL_') ? 'official'
      : 'admin')

    const dbRow = dbMap.get(key)
    const envVal = process.env[def.envKey]

    let source: 'db' | 'env' | 'none' = 'none'
    let maskedValue: string | null = null
    let description = ''

    if (dbRow?.config_value) {
      source = 'db'
      description = dbRow.description ?? ''
      if (def.secret) {
        // 敏感值解密再遮罩
        try {
          const plain = dbRow.encryption_iv && dbRow.encryption_tag
            ? decryptApiKey({ encrypted: dbRow.config_value, iv: dbRow.encryption_iv, tag: dbRow.encryption_tag })
            : dbRow.config_value
          maskedValue = maskApiKey(plain)
        } catch {
          maskedValue = '••••••••（解密失敗）'
        }
      } else {
        maskedValue = dbRow.config_value
      }
    } else if (envVal && tenantId === 'default') {
      // ENV fallback 只對 default 租戶顯示，其他租戶不能看到平台設定的 token
      source = 'env'
      maskedValue = def.secret ? maskApiKey(envVal) : envVal
    }

    result.push({ key, label: def.label, group, isSecret: def.secret, source, maskedValue, description })
  }

  return result
}

// ===== Admin 用：儲存設定 =====

export async function saveLineConfig(
  key: LineConfigKey,
  value: string,
  tenantId = 'default'
): Promise<void> {
  const def = LINE_CONFIG_KEYS[key]

  let storedValue: string
  let iv: string | null = null
  let tag: string | null = null

  if (def.secret) {
    const encrypted = encryptApiKey(value)
    storedValue = encrypted.encrypted
    iv = encrypted.iv
    tag = encrypted.tag
  } else {
    storedValue = value
  }

  await queryOne(
    `INSERT INTO line_configs (tenant_id, config_key, config_value, is_secret, encryption_iv, encryption_tag, description, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, '', NOW())
     ON CONFLICT (tenant_id, config_key)
     DO UPDATE SET config_value = $3, is_secret = $4, encryption_iv = $5, encryption_tag = $6, updated_at = NOW()
     RETURNING id`,
    [tenantId, key, storedValue, def.secret, iv, tag]
  )

  clearLineConfigCache()
}

// ===== Admin 用：刪除設定（回退到 env） =====

export async function deleteLineConfig(key: LineConfigKey, tenantId = 'default'): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `DELETE FROM line_configs WHERE tenant_id = $1 AND config_key = $2 RETURNING id`,
    [tenantId, key]
  )
  clearLineConfigCache()
  return !!row
}

// ===== Admin 用：測試 LINE API 連線 =====

export async function testLineConnection(
  channel: 'insight' | 'official',
  tenantId = 'default'
): Promise<{ ok: boolean; botName?: string; error?: string }> {
  const tokenKey: LineConfigKey = channel === 'insight'
    ? 'INSIGHT_CHANNEL_ACCESS_TOKEN'
    : 'OFFICIAL_CHANNEL_ACCESS_TOKEN'

  const token = await getLineConfig(tokenKey, tenantId)
  if (!token) return { ok: false, error: '未設定 Channel Access Token' }

  try {
    const res = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `LINE API ${res.status}: ${body}` }
    }

    const data = await res.json() as { displayName?: string }
    return { ok: true, botName: data.displayName }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

import { query, queryOne, execute } from '@/lib/db'
import crypto from 'crypto'

// ===== 型別定義 =====

export interface RuleOutput {
  questionKey: string
  optionValue: string
  tagKey: string
  tagValue: string
}

interface ApiKeyRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  key_hash: string
  scopes: string[]
  is_active: boolean
}

interface SurveyValidationInput {
  title?: unknown
  questions?: unknown
}

interface QuestionInput {
  key?: unknown
  type?: unknown
  content?: unknown
  options?: unknown
}

interface OptionInput {
  label?: unknown
  value?: unknown
}

const SELECTABLE_TYPES = new Set(['single', 'multiple'])
const VALID_TYPES = new Set(['single', 'multiple', 'text', 'rating', 'scale', 'date', 'file_upload'])

// ===== API Key 工具函式 =====

/** 產生原始 API Key（格式：sie_ + 32 bytes hex = 64 chars），只顯示一次 */
export function generateRawApiKey(): string {
  const hex = crypto.randomBytes(32).toString('hex')
  return `sie_${hex}`
}

/** 將原始 Key 做 SHA-256 雜湊，用於資料庫儲存 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

/**
 * 驗證請求 Authorization header 帶入的 Bearer Key
 * 回傳 { tenantId, scopes } 或 null（無效 / 停用）
 */
export async function verifyApiKey(
  rawKey: string
): Promise<{ tenantId: string; scopes: string[]; keyHash: string } | null> {
  if (!rawKey || !rawKey.startsWith('sie_')) return null

  const keyHash = hashApiKey(rawKey)
  const row = await queryOne<ApiKeyRow>(
    `SELECT id, tenant_id, key_hash, scopes, is_active
     FROM api_keys
     WHERE key_hash = $1`,
    [keyHash]
  )

  if (!row || !row.is_active) return null

  return { tenantId: row.tenant_id, scopes: row.scopes, keyHash }
}

/** 更新 last_used_at（非阻塞，不 await，錯誤靜默忽略） */
export function touchApiKey(keyHash: string): void {
  execute(
    `UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1`,
    [keyHash]
  ).catch(() => {
    // 非關鍵路徑，靜默忽略
  })
}

// ===== Rule Engine 核心功能 =====

/**
 * 取得特定問卷的所有標籤規則，格式化供外部使用
 */
export async function listSurveyRules(surveyId: string): Promise<RuleOutput[]> {
  const rows = await query<{
    question_key: string
    option_value: string
    tag_key: string
    tag_value: string
  }>(
    `SELECT question_key, option_value, tag_key, tag_value
     FROM tag_rules
     WHERE survey_id = $1
     ORDER BY question_key, option_value`,
    [surveyId]
  )

  return rows.map(row => ({
    questionKey: row.question_key,
    optionValue: row.option_value,
    tagKey: row.tag_key,
    tagValue: row.tag_value,
  }))
}

/**
 * 驗證問卷 JSON 結構
 * 回傳 { valid: true, errors: [] } 或 { valid: false, errors: ['...'] }
 */
export function validateSurveyJson(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['payload 必須是物件'] }
  }

  const obj = payload as SurveyValidationInput

  // 驗證 title
  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    errors.push('title 為必填字串')
  }

  // 驗證 questions
  if (!Array.isArray(obj.questions)) {
    errors.push('questions 必須是陣列')
    return { valid: false, errors }
  }

  if (obj.questions.length === 0) {
    errors.push('questions 不可為空陣列')
  }

  obj.questions.forEach((q: unknown, index: number) => {
    const prefix = `questions[${index}]`

    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      errors.push(`${prefix} 必須是物件`)
      return
    }

    const question = q as QuestionInput

    // key
    if (typeof question.key !== 'string' || question.key.trim() === '') {
      errors.push(`${prefix}.key 為必填字串`)
    }

    // type
    if (typeof question.type !== 'string' || !VALID_TYPES.has(question.type)) {
      errors.push(
        `${prefix}.type 必須是以下其中一種：${Array.from(VALID_TYPES).join('、')}`
      )
    }

    // content
    if (typeof question.content !== 'string' || question.content.trim() === '') {
      errors.push(`${prefix}.content 為必填字串`)
    }

    // options（single / multiple 題型必須有 options）
    const qType = typeof question.type === 'string' ? question.type : ''
    if (SELECTABLE_TYPES.has(qType)) {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        errors.push(`${prefix}.options 在 ${qType} 題型中為必填非空陣列`)
      } else {
        question.options.forEach((opt: unknown, optIndex: number) => {
          const optPrefix = `${prefix}.options[${optIndex}]`

          if (!opt || typeof opt !== 'object' || Array.isArray(opt)) {
            errors.push(`${optPrefix} 必須是物件`)
            return
          }

          const option = opt as OptionInput

          if (typeof option.label !== 'string' || option.label.trim() === '') {
            errors.push(`${optPrefix}.label 為必填字串`)
          }

          if (typeof option.value !== 'string' || option.value.trim() === '') {
            errors.push(`${optPrefix}.value 為必填字串`)
          }
        })
      }
    }
  })

  return { valid: errors.length === 0, errors }
}

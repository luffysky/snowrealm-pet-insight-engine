import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/aiCrypto'
import { randomUUID } from 'crypto'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') return null
  return payload
}

/**
 * 全平台 AI 模型管理 API。
 *
 * 管理所有 AI provider/model 設定，跨 Insight Engine + YukiBoard。
 * 資料表：platform_ai_models
 */

// ===== GET: 列出所有平台 AI 模型設定 =====
export async function GET(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  // 先確保表存在
  await ensureTable()

  const rows = await query<{
    id: string
    provider: string
    model_id: string
    display_name: string
    category: string
    api_endpoint: string
    has_key: boolean
    is_active: boolean
    max_tokens: number
    input_price_per_1k: number
    output_price_per_1k: number
    supported_features: string
    notes: string
    platform: string
    created_at: string
    updated_at: string
  }>(
    `SELECT id, provider, model_id, display_name, category, api_endpoint,
            (encrypted_api_key IS NOT NULL AND encrypted_api_key != '') AS has_key,
            is_active, max_tokens, input_price_per_1k, output_price_per_1k,
            supported_features, notes, platform, created_at, updated_at
     FROM platform_ai_models
     ORDER BY provider ASC, display_name ASC`
  )

  // Also fetch per-tenant configs summary
  const tenantConfigs = await query<{
    provider: string
    count: number
    active_count: number
  }>(
    `SELECT provider, COUNT(*)::int as count, COUNT(*) FILTER (WHERE is_active)::int as active_count
     FROM ai_provider_configs
     GROUP BY provider`
  )

  return NextResponse.json({
    models: rows.map(r => ({
      id: r.id,
      provider: r.provider,
      modelId: r.model_id,
      displayName: r.display_name,
      category: r.category,
      apiEndpoint: r.api_endpoint,
      hasKey: r.has_key,
      isActive: r.is_active,
      maxTokens: r.max_tokens,
      inputPrice: r.input_price_per_1k,
      outputPrice: r.output_price_per_1k,
      supportedFeatures: r.supported_features ? r.supported_features.split(',') : [],
      notes: r.notes || '',
      platform: r.platform,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    tenantSummary: tenantConfigs,
  })
}

// ===== POST: 新增/更新模型 =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  await ensureTable()

  const body = await request.json()
  const {
    id, provider, modelId, displayName, category, apiEndpoint,
    apiKey, isActive, maxTokens, inputPrice, outputPrice,
    supportedFeatures, notes, platform,
  } = body as {
    id?: string
    provider: string
    modelId: string
    displayName: string
    category?: string
    apiEndpoint?: string
    apiKey?: string
    isActive?: boolean
    maxTokens?: number
    inputPrice?: number
    outputPrice?: number
    supportedFeatures?: string[]
    notes?: string
    platform?: string
  }

  if (!provider || !modelId || !displayName) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  // Encrypt API key if provided
  let encryptedKey = null
  let encryptionIv = null
  let encryptionTag = null
  if (apiKey) {
    const enc = encryptApiKey(apiKey)
    encryptedKey = enc.encrypted
    encryptionIv = enc.iv
    encryptionTag = enc.tag
  }

  if (id) {
    // Update existing
    if (apiKey) {
      await execute(
        `UPDATE platform_ai_models SET
           provider = $2, model_id = $3, display_name = $4, category = $5,
           api_endpoint = $6, encrypted_api_key = $7, encryption_iv = $8, encryption_tag = $9,
           is_active = $10, max_tokens = $11, input_price_per_1k = $12, output_price_per_1k = $13,
           supported_features = $14, notes = $15, platform = $16, updated_at = NOW()
         WHERE id = $1`,
        [id, provider, modelId, displayName, category || 'chat',
         apiEndpoint || '', encryptedKey, encryptionIv, encryptionTag,
         isActive !== false, maxTokens || 4096, inputPrice || 0, outputPrice || 0,
         (supportedFeatures || []).join(','), notes || '', platform || 'insight']
      )
    } else {
      await execute(
        `UPDATE platform_ai_models SET
           provider = $2, model_id = $3, display_name = $4, category = $5,
           api_endpoint = $6, is_active = $7, max_tokens = $8,
           input_price_per_1k = $9, output_price_per_1k = $10,
           supported_features = $11, notes = $12, platform = $13, updated_at = NOW()
         WHERE id = $1`,
        [id, provider, modelId, displayName, category || 'chat',
         apiEndpoint || '', isActive !== false, maxTokens || 4096,
         inputPrice || 0, outputPrice || 0,
         (supportedFeatures || []).join(','), notes || '', platform || 'insight']
      )
    }
    return NextResponse.json({ success: true, id })
  } else {
    // Insert new
    const newId = randomUUID()
    await execute(
      `INSERT INTO platform_ai_models
         (id, provider, model_id, display_name, category, api_endpoint,
          encrypted_api_key, encryption_iv, encryption_tag,
          is_active, max_tokens, input_price_per_1k, output_price_per_1k,
          supported_features, notes, platform)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [newId, provider, modelId, displayName, category || 'chat',
       apiEndpoint || '', encryptedKey, encryptionIv, encryptionTag,
       isActive !== false, maxTokens || 4096, inputPrice || 0, outputPrice || 0,
       (supportedFeatures || []).join(','), notes || '', platform || 'insight']
    )
    return NextResponse.json({ success: true, id: newId })
  }
}

// ===== PATCH: 切換啟用/停用 =====
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body as { id: string; action: string }

  if (action === 'toggle') {
    await execute(
      `UPDATE platform_ai_models SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1`,
      [id]
    )
  }

  return NextResponse.json({ success: true })
}

// ===== DELETE =====
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const admin = await verifySuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  await execute('DELETE FROM platform_ai_models WHERE id = $1', [id])
  return NextResponse.json({ success: true })
}

// ===== 確保表存在 =====
async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS platform_ai_models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'chat',
      api_endpoint TEXT DEFAULT '',
      encrypted_api_key TEXT,
      encryption_iv TEXT,
      encryption_tag TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      max_tokens INTEGER NOT NULL DEFAULT 4096,
      input_price_per_1k NUMERIC(10,6) NOT NULL DEFAULT 0,
      output_price_per_1k NUMERIC(10,6) NOT NULL DEFAULT 0,
      supported_features TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      platform TEXT NOT NULL DEFAULT 'insight',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, model_id, platform)
    )
  `)
}

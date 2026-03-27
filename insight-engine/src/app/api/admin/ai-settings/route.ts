import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/aiCrypto'
import { randomUUID } from 'crypto'
import { getTenantContext, requireRole } from '@/lib/tenant'

// ===== GET: 列出所有 AI provider configs（不回傳明文 key，不載入加密欄位） =====
export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const rows = await query<{
    id: string
    provider: string
    display_name: string
    default_model: string
    is_primary: boolean
    is_active: boolean
    has_key: boolean
    created_at: string
    updated_at: string
  }>(
    `SELECT id, provider, display_name, default_model,
            is_primary, is_active, created_at, updated_at,
            (encrypted_api_key IS NOT NULL AND encrypted_api_key != '') AS has_key
     FROM ai_provider_configs
     WHERE tenant_id = $1
     ORDER BY is_primary DESC, created_at ASC`, [tenantId]
  )

  const configs = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    displayName: r.display_name,
    defaultModel: r.default_model,
    isPrimary: r.is_primary,
    isActive: r.is_active,
    hasKey: r.has_key,
    maskedKey: r.has_key ? '••••••••' : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  return NextResponse.json({ configs })
}

// ===== POST: 新增或更新 AI provider config =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const body = await request.json()
  const { provider, displayName, apiKey, defaultModel, isPrimary } = body as {
    provider?: string
    displayName?: string
    apiKey?: string
    defaultModel?: string
    isPrimary?: boolean
  }

  if (!provider || !apiKey) {
    return NextResponse.json({ error: '缺少 provider 或 apiKey' }, { status: 400 })
  }

  // 驗證 provider
  const validProviders = ['openai', 'anthropic', 'google', 'custom']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: '不支援的 provider' }, { status: 400 })
  }

  // 加密 API Key
  const { encrypted, iv, tag } = encryptApiKey(apiKey)

  // 如果設為主要，先取消其他主要
  if (isPrimary) {
    await execute(
      `UPDATE ai_provider_configs SET is_primary = false WHERE tenant_id = $1`, [tenantId]
    )
  }

  // Upsert by tenant_id + provider
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM ai_provider_configs WHERE tenant_id = $1 AND provider = $2`,
    [tenantId, provider]
  )

  if (existing) {
    await execute(
      `UPDATE ai_provider_configs SET
         display_name = COALESCE($1, display_name),
         encrypted_api_key = $2,
         encryption_iv = $3,
         encryption_tag = $4,
         default_model = COALESCE($5, default_model),
         is_primary = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [displayName, encrypted, iv, tag, defaultModel, isPrimary ?? false, existing.id]
    )
    return NextResponse.json({ success: true, id: existing.id, action: 'updated' })
  }

  const id = randomUUID()
  await execute(
    `INSERT INTO ai_provider_configs
       (id, tenant_id, provider, display_name, encrypted_api_key, encryption_iv, encryption_tag, default_model, is_primary, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
    [id, tenantId, provider, displayName ?? provider, encrypted, iv, tag, defaultModel ?? 'gpt-4o-mini', isPrimary ?? false]
  )

  return NextResponse.json({ success: true, id, action: 'created' })
}

// ===== DELETE: 刪除 AI provider config =====
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  const count = await execute(
    `DELETE FROM ai_provider_configs WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  )

  if (count === 0) {
    return NextResponse.json({ error: '找不到該設定' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// ===== PATCH: 驗證 API Key 是否有效 =====
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const body = await request.json()
  const { id, action } = body as { id?: string; action?: string }

  if (!id) {
    return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  }

  if (action === 'verify') {
    // 讀取加密 key 並解密
    const row = await queryOne<{
      provider: string
      encrypted_api_key: string
      encryption_iv: string
      encryption_tag: string
    }>(
      `SELECT provider, encrypted_api_key, encryption_iv, encryption_tag
       FROM ai_provider_configs WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (!row || !row.encrypted_api_key) {
      return NextResponse.json({ error: '找不到 API Key' }, { status: 404 })
    }

    const plainKey = decryptApiKey({
      encrypted: row.encrypted_api_key,
      iv: row.encryption_iv,
      tag: row.encryption_tag,
    })

    // 根據 provider 做簡單驗證
    let valid = false
    let error: string | null = null

    try {
      if (row.provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${plainKey}` },
        })
        valid = res.ok
        if (!valid) error = `OpenAI 回傳 ${res.status}`
      } else if (row.provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': plainKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        })
        // 200 或 400 (bad request but key is valid) 都算 key 有效
        valid = res.status === 200 || res.status === 400
        if (!valid) error = `Anthropic 回傳 ${res.status}`
      } else {
        // 其他 provider 暫時跳過驗證
        valid = true
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '驗證時發生錯誤'
    }

    // 記錄遮罩 key
    const masked = maskApiKey(plainKey)

    return NextResponse.json({ valid, maskedKey: masked, error })
  }

  if (action === 'toggle') {
    await execute(
      `UPDATE ai_provider_configs SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  }

  if (action === 'set-primary') {
    await execute(
      `UPDATE ai_provider_configs SET is_primary = false WHERE tenant_id = $1`, [tenantId]
    )
    await execute(
      `UPDATE ai_provider_configs SET is_primary = true, updated_at = NOW() WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    const { defaultModel, newApiKey } = body as { defaultModel?: string; newApiKey?: string }
    if (newApiKey) {
      const { encrypted, iv, tag } = encryptApiKey(newApiKey)
      await execute(
        `UPDATE ai_provider_configs
         SET encrypted_api_key = $1, encryption_iv = $2, encryption_tag = $3,
             default_model = COALESCE($4, default_model), updated_at = NOW()
         WHERE id = $5 AND tenant_id = $6`,
        [encrypted, iv, tag, defaultModel ?? null, id, tenantId]
      )
    } else if (defaultModel) {
      await execute(
        `UPDATE ai_provider_configs SET default_model = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
        [defaultModel, id, tenantId]
      )
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知的 action' }, { status: 400 })
}

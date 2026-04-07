import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { decryptApiKey } from '@/lib/aiCrypto'

const ENV_OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const ENV_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

/** 取得 API Key — 優先從總後台 platform_ai_models 讀取（加密），env 為 fallback */
async function getApiKey(provider: string): Promise<string> {
  try {
    const row = await queryOne<{
      encrypted_api_key: string | null
      encryption_iv: string | null
      encryption_tag: string | null
    }>(
      `SELECT encrypted_api_key, encryption_iv, encryption_tag
       FROM platform_ai_models
       WHERE provider = $1 AND is_active = true
         AND encrypted_api_key IS NOT NULL AND encrypted_api_key != ''
       ORDER BY updated_at DESC LIMIT 1`,
      [provider]
    )
    if (row?.encrypted_api_key && row?.encryption_iv && row?.encryption_tag) {
      return decryptApiKey({
        encrypted: row.encrypted_api_key,
        iv: row.encryption_iv,
        tag: row.encryption_tag,
      })
    }
  } catch { /* DB not ready or table doesn't exist yet — fall through */ }

  // Fallback to env
  if (provider === 'anthropic') return ENV_ANTHROPIC_KEY
  return ENV_OPENAI_KEY
}

// Cached keys (refresh every 5 min)
let cachedKeys: Record<string, { key: string; ts: number }> = {}
async function getCachedApiKey(provider: string): Promise<string> {
  const cached = cachedKeys[provider]
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.key
  const key = await getApiKey(provider)
  cachedKeys[provider] = { key, ts: Date.now() }
  return key
}

interface ProxyRequest {
  invite_code?: string
  auth_token?: string
  device_id: string
  provider: 'openai' | 'anthropic'
  model: string
  prompt: string
  system_prompt?: string
  max_tokens?: number
  stream?: boolean
}

/** 檢查平台禮遇特權 — 有特權則無限額度 */
async function checkPrivilege(authToken: string): Promise<{ privileged: boolean; userId: string | null }> {
  try {
    const payload = await verifyToken(authToken)
    if (!payload?.sub) return { privileged: false, userId: null }
    const user = await queryOne<{ yukiboard_privilege: boolean }>(
      `SELECT COALESCE(yukiboard_privilege, false) AS yukiboard_privilege FROM admin_users WHERE id = $1`,
      [payload.sub],
    )
    return { privileged: user?.yukiboard_privilege === true, userId: payload.sub }
  } catch {
    return { privileged: false, userId: null }
  }
}

/** 驗證邀請碼，回傳 code row 或 null */
async function verifyInviteCode(code: string) {
  return queryOne<{
    id: string
    type: string
    daily_token_limit: number
    max_uses: number
    used_count: number
    is_active: boolean
    expires_at: string | null
  }>(
    `SELECT id, type, daily_token_limit, max_uses, used_count, is_active, expires_at
     FROM yukiboard_invite_codes
     WHERE code = $1`,
    [code],
  )
}

/** 取得今日已用 token 量 */
async function getTodayUsage(codeId: string, deviceId: string): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(tokens_used), 0) AS total
     FROM yukiboard_ai_usage
     WHERE invite_code_id = $1 AND device_id = $2
       AND created_at >= CURRENT_DATE`,
    [codeId, deviceId],
  )
  return parseInt(row?.total ?? '0', 10)
}

/** 記錄使用量 */
async function recordUsage(codeId: string, deviceId: string, tokensUsed: number, provider: string, model: string) {
  await execute(
    `INSERT INTO yukiboard_ai_usage (invite_code_id, device_id, tokens_used, provider, model)
     VALUES ($1, $2, $3, $4, $5)`,
    [codeId, deviceId, tokensUsed, provider, model],
  )
}

/** 呼叫 OpenAI */
async function callOpenAI(prompt: string, systemPrompt: string, model: string, maxTokens: number, apiKey: string): Promise<{ text: string; tokensUsed: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const tokensUsed = data.usage?.total_tokens ?? Math.ceil(text.length / 4)
  return { text, tokensUsed }
}

/** 呼叫 Anthropic */
async function callAnthropic(prompt: string, systemPrompt: string, model: string, maxTokens: number, apiKey: string): Promise<{ text: string; tokensUsed: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const text = data.content?.map((c: { type: string; text?: string }) => c.text ?? '').join('') ?? ''
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
  return { text, tokensUsed: tokensUsed || Math.ceil(text.length / 4) }
}

/** SSE 串流 — Anthropic */
async function callAnthropicStream(prompt: string, systemPrompt: string, model: string, maxTokens: number, apiKey: string): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      stream: true,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
}

/** SSE 串流 — OpenAI */
async function callOpenAIStream(prompt: string, systemPrompt: string, model: string, maxTokens: number, apiKey: string): Promise<Response> {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      stream: true,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
    }),
  })
}

/** 共用的驗證邏輯（invite_code / auth_token） */
async function verifyAccess(body: ProxyRequest): Promise<{
  codeId: string | null
  dailyLimit: number
  isPrivileged: boolean
  error?: string
  status?: number
}> {
  const { invite_code, auth_token, device_id } = body
  let codeId: string | null = null
  let dailyLimit = 0
  let isPrivileged = false

  if (auth_token) {
    const { privileged, userId } = await checkPrivilege(auth_token)
    if (privileged) {
      isPrivileged = true
      codeId = `privilege:${userId}`
    }
  }

  if (!isPrivileged) {
    if (!invite_code) return { codeId: null, dailyLimit: 0, isPrivileged: false, error: '邀請碼無效或無特權', status: 403 }
    const codeRow = await verifyInviteCode(invite_code)
    if (!codeRow || !codeRow.is_active) return { codeId: null, dailyLimit: 0, isPrivileged: false, error: '邀請碼無效或已停用', status: 403 }
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) return { codeId: null, dailyLimit: 0, isPrivileged: false, error: '邀請碼已過期', status: 403 }

    const todayUsed = await getTodayUsage(codeRow.id, device_id)
    const remaining = codeRow.daily_token_limit - todayUsed
    if (remaining <= 0) return { codeId: null, dailyLimit: 0, isPrivileged: false, error: '今日額度已用完，明天再試', status: 429 }

    codeId = codeRow.id
    dailyLimit = codeRow.daily_token_limit
  }

  return { codeId, dailyLimit, isPrivileged }
}

/** POST — AI 代理轉發（支援邀請碼 或 平台禮遇特權，可選 SSE 串流） */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProxyRequest
    const { device_id, provider, model, prompt, system_prompt, max_tokens, stream = false } = body

    if (!device_id || !provider || !prompt) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
    }
    if (!body.invite_code && !body.auth_token) {
      return NextResponse.json({ error: '需要邀請碼或登入 token' }, { status: 400 })
    }

    const access = await verifyAccess(body)
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status ?? 403 })
    }
    const { codeId, dailyLimit, isPrivileged } = access

    const tokenCap = isPrivileged ? 4096 : Math.min(dailyLimit, 4096)
    const effectiveMaxTokens = Math.min(max_tokens ?? 1024, tokenCap)

    // 動態取得 API Key（總後台 DB → env fallback）
    const activeKey = await getCachedApiKey(provider)
    if (!activeKey) {
      return NextResponse.json({ error: '伺服器未設定 AI API Key（請至總後台 AI 模型管理設定）' }, { status: 503 })
    }

    // ── SSE 串流模式 ──
    if (stream) {
      let aiRes: Response
      if (provider === 'anthropic') {
        aiRes = await callAnthropicStream(prompt, system_prompt ?? '', model, effectiveMaxTokens, activeKey)
      } else {
        aiRes = await callOpenAIStream(prompt, system_prompt ?? '', model, effectiveMaxTokens, activeKey)
      }
      if (!aiRes.ok) {
        const errBody = await aiRes.text()
        return NextResponse.json({ error: `AI error ${aiRes.status}: ${errBody.slice(0, 200)}` }, { status: 502 })
      }

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const reader = aiRes.body?.getReader()
      if (!reader) {
        return NextResponse.json({ error: 'empty stream' }, { status: 502 })
      }

      let totalTokens = 0
      const isAnthropic = provider === 'anthropic'

      const readable = new ReadableStream({
        async start(controller) {
          let buffer = ''
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed.startsWith('data:')) continue
                const data = trimmed.slice(5).trim()
                if (data === '[DONE]') continue

                try {
                  const obj = JSON.parse(data)
                  let text = ''
                  if (isAnthropic) {
                    // Anthropic SSE: content_block_delta → delta.text
                    if (obj.type === 'content_block_delta') {
                      text = obj.delta?.text ?? ''
                    } else if (obj.type === 'message_delta') {
                      totalTokens = (obj.usage?.output_tokens ?? 0)
                    }
                  } else {
                    // OpenAI SSE: choices[0].delta.content
                    text = obj.choices?.[0]?.delta?.content ?? ''
                  }
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                    totalTokens += Math.ceil(text.length / 4)
                  }
                } catch { /* skip unparseable lines */ }
              }
            }
            // 送總 token 數
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tokens_used: totalTokens })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))

            // 記錄使用量
            if (codeId && !codeId.startsWith('privilege:')) {
              await recordUsage(codeId, device_id, totalTokens, provider, model)
            }
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // ── 非串流模式 ──
    let result: { text: string; tokensUsed: number }
    if (provider === 'anthropic') {
      result = await callAnthropic(prompt, system_prompt ?? '', model, effectiveMaxTokens, activeKey)
    } else {
      result = await callOpenAI(prompt, system_prompt ?? '', model, effectiveMaxTokens, activeKey)
    }

    if (codeId && !codeId.startsWith('privilege:')) {
      await recordUsage(codeId, device_id, result.tokensUsed, provider, model)
    }

    const remaining = isPrivileged
      ? 999999
      : dailyLimit - (await getTodayUsage(codeId!, device_id))

    return NextResponse.json({
      text: result.text,
      tokens_used: result.tokensUsed,
      remaining,
      privileged: isPrivileged,
    })
  } catch (error) {
    console.error('[YukiBoard AI Proxy] error:', error)
    const msg = error instanceof Error ? error.message : '伺服器錯誤'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'

const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

interface ProxyRequest {
  invite_code: string
  device_id: string
  provider: 'openai' | 'anthropic'
  model: string
  prompt: string
  system_prompt?: string
  max_tokens?: number
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
async function callOpenAI(prompt: string, systemPrompt: string, model: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
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
async function callAnthropic(prompt: string, systemPrompt: string, model: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
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

/** POST — AI 代理轉發 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProxyRequest
    const { invite_code, device_id, provider, model, prompt, system_prompt, max_tokens } = body

    if (!invite_code || !device_id || !provider || !prompt) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
    }

    // 1. 驗證邀請碼
    const codeRow = await verifyInviteCode(invite_code)
    if (!codeRow || !codeRow.is_active) {
      return NextResponse.json({ error: '邀請碼無效或已停用' }, { status: 403 })
    }
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: '邀請碼已過期' }, { status: 403 })
    }

    // 2. 檢查每日額度
    const todayUsed = await getTodayUsage(codeRow.id, device_id)
    const remaining = codeRow.daily_token_limit - todayUsed
    if (remaining <= 0) {
      return NextResponse.json({ error: '今日額度已用完，明天再試', remaining: 0 }, { status: 429 })
    }

    // 3. 轉發 AI 請求
    const effectiveMaxTokens = Math.min(max_tokens ?? 1024, remaining, 4096)

    let result: { text: string; tokensUsed: number }
    if (provider === 'anthropic' && ANTHROPIC_KEY) {
      result = await callAnthropic(prompt, system_prompt ?? '', model, effectiveMaxTokens)
    } else if (OPENAI_KEY) {
      result = await callOpenAI(prompt, system_prompt ?? '', model, effectiveMaxTokens)
    } else {
      return NextResponse.json({ error: '伺服器未設定 AI API Key' }, { status: 503 })
    }

    // 4. 記錄使用量
    await recordUsage(codeRow.id, device_id, result.tokensUsed, provider, model)

    return NextResponse.json({
      text: result.text,
      tokens_used: result.tokensUsed,
      remaining: remaining - result.tokensUsed,
    })
  } catch (error) {
    console.error('[YukiBoard AI Proxy] error:', error)
    const msg = error instanceof Error ? error.message : '伺服器錯誤'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

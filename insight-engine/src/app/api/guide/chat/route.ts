import { NextRequest } from 'next/server'
import { getPlatformKey, getActiveAiKey } from '@/lib/aiService'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { verifyToken } from '@/lib/jwt'
import { queryOne, execute } from '@/lib/db'
import {
  classifyIntent,
  selectLLMProvider,
  buildSystemPrompt,
  wrapWithAuthorFraming,
  parseGuideResponse,
  shouldTriggerCoupleInteraction,
  buildCoupleInteractionPrompt,
  GuideContext,
  GuideMessage,
  UserMemory,
  CharacterType,
  PromptSettings,
} from '@/lib/guideEngine'
import { hasAgentIntent, AGENT_TOOLS_SCHEMA } from '@/lib/yukirin/agentTools'
import { runAgentLoop } from '@/lib/yukirin/agentExecutor'

const PLATFORM_SETTINGS_KEY = 'yukirin_prompts'

let cachedPromptSettings: PromptSettings | null = null
let cacheExpiry = 0

/** 載入總後台自訂的 prompt 設定（快取 60 秒，避免每次查 DB） */
async function loadPromptSettings(): Promise<PromptSettings | null> {
  const now = Date.now()
  if (cachedPromptSettings !== null && now < cacheExpiry) return cachedPromptSettings

  try {
    const row = await queryOne<{ value: string }>(
      `SELECT value FROM platform_settings WHERE key = $1`,
      [PLATFORM_SETTINGS_KEY]
    )
    if (row?.value) {
      const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      cachedPromptSettings = parsed as PromptSettings
      cacheExpiry = now + 60_000
      return cachedPromptSettings
    }
  } catch { /* silently skip — use defaults */ }

  cacheExpiry = now + 60_000
  return null
}

/** 從 DB 讀取使用者記憶（角色選擇、暱稱、造訪次數等） */
async function loadUserMemory(userId: string | null, ip: string): Promise<UserMemory> {
  try {
    const key = userId ? `user:${userId}` : `ip:${ip}`
    const row = await queryOne<{
      nickname: string | null
      visit_count: number
      interests: string | null
      last_topic: string | null
      selected_character: string | null
    }>(
      `SELECT nickname, visit_count, interests, last_topic, selected_character
       FROM guide_user_memory WHERE user_key = $1`,
      [key]
    )
    return {
      nickname: row?.nickname ?? undefined,
      visitCount: row?.visit_count ?? 1,
      interests: row?.interests ? row.interests.split(',') : undefined,
      lastTopic: row?.last_topic ?? undefined,
      selectedCharacter: (row?.selected_character as CharacterType) ?? 'yukirin',
    }
  } catch {
    return { visitCount: 1, selectedCharacter: 'yukirin' }
  }
}

/** 取得今日平台快速統計（super_admin 專用） */
async function getPlatformQuickStats() {
  try {
    const row = await queryOne<{ dau: string; today_new: string; today_responses: string }>(
      `SELECT
         (SELECT COUNT(DISTINCT user_id)::text FROM responses WHERE created_at >= CURRENT_DATE) AS dau,
         (SELECT COUNT(*)::text FROM admin_users WHERE created_at >= CURRENT_DATE) AS today_new,
         (SELECT COUNT(*)::text FROM responses WHERE created_at >= CURRENT_DATE AND status = 'completed') AS today_responses`
    )
    return {
      dau: parseInt(row?.dau ?? '0'),
      todayNew: parseInt(row?.today_new ?? '0'),
      todayResponses: parseInt(row?.today_responses ?? '0'),
    }
  } catch {
    return undefined
  }
}

export const runtime = 'nodejs'

export const FREE_DAILY_LIMIT = 20

interface ChatRequest {
  message: string
  character?: CharacterType
  context?: GuideContext
  history?: GuideMessage[]
  /** 本 session 已觸發情侶互動次數（前端維護） */
  coupleCount?: number
  /** 上次觸發情侶互動的 timestamp（前端維護） */
  lastCoupleAt?: number
}

function getUserKey(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  return `ip:${ip}`
}

interface QuotaResult {
  allowed: boolean
  freeRemaining: number   // 剩餘免費次數（含本次消耗後）
  purchasedRemaining: number
  usedPurchased: boolean  // 是否消耗了購買次數
}

/** 原子扣除額度，回傳是否允許 + 剩餘數量 */
async function consumeQuota(userKey: string): Promise<QuotaResult> {
  const today = new Date().toISOString().slice(0, 10)
  try {
    // 先查今日免費使用量
    const rateRow = await queryOne<{ free_used: number }>(
      `INSERT INTO guide_chat_rate (user_key, date, free_used)
       VALUES ($1, $2, 0)
       ON CONFLICT (user_key, date) DO NOTHING
       RETURNING free_used`,
      [userKey, today]
    ).then(async () =>
      queryOne<{ free_used: number }>(
        `SELECT free_used FROM guide_chat_rate WHERE user_key = $1 AND date = $2`,
        [userKey, today]
      )
    )

    const freeUsed = rateRow?.free_used ?? 0

    // 免費次數還有
    if (freeUsed < FREE_DAILY_LIMIT) {
      await execute(
        `INSERT INTO guide_chat_rate (user_key, date, free_used)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_key, date) DO UPDATE
           SET free_used = guide_chat_rate.free_used + 1`,
        [userKey, today]
      )
      return {
        allowed: true,
        freeRemaining: FREE_DAILY_LIMIT - freeUsed - 1,
        purchasedRemaining: 0,
        usedPurchased: false,
      }
    }

    // 免費用完 → 嘗試購買次數
    const creditRow = await queryOne<{ credits: number }>(
      `SELECT credits FROM guide_chat_credits WHERE user_key = $1`,
      [userKey]
    )
    const credits = creditRow?.credits ?? 0

    if (credits > 0) {
      await execute(
        `UPDATE guide_chat_credits SET credits = credits - 1, updated_at = NOW()
         WHERE user_key = $1`,
        [userKey]
      )
      return {
        allowed: true,
        freeRemaining: 0,
        purchasedRemaining: credits - 1,
        usedPurchased: true,
      }
    }

    return { allowed: false, freeRemaining: 0, purchasedRemaining: 0, usedPurchased: false }
  } catch {
    // migration 還沒跑時不阻斷
    return { allowed: true, freeRemaining: FREE_DAILY_LIMIT, purchasedRemaining: 0, usedPurchased: false }
  }
}

export async function POST(req: NextRequest) {
  // ── 身份識別（每次都重新驗證）─────────────────────────────────────────────
  const token = req.cookies.get('admin_session')?.value ?? null
  let userId: string | null = null
  let userRole: string | undefined
  let userName: string | undefined
  if (token) {
    const payload = await verifyToken(token)
    userId = payload?.sub ?? null
    userRole = payload?.role ?? undefined
    userName = payload?.name ?? undefined
  }

  // ── 特權帳號每次重新查 DB（platform_unlimited 或 super_admin 均視為無限制）─────
  const isUnlimited = await isUserPlatformUnlimited(userId) || userRole === 'super_admin'

  let quotaResult: QuotaResult = {
    allowed: true,
    freeRemaining: FREE_DAILY_LIMIT,
    purchasedRemaining: 0,
    usedPurchased: false,
  }

  if (!isUnlimited) {
    const userKey = getUserKey(req, userId)
    quotaResult = await consumeQuota(userKey)

    if (!quotaResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'no_turns',
          freeRemaining: 0,
          purchasedCredits: 0,
          isLoggedIn: !!userId,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const body = await req.json() as ChatRequest
  const { message, character, history = [] } = body
  let { context = {} } = body

  // 讀取使用者記憶（角色選擇、暱稱、造訪次數等）
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const userMemory = await loadUserMemory(userId, ip)

  // 注入身份資訊 + 使用者記憶到 context
  // 載入總後台自訂 prompt 設定
  const promptSettings = await loadPromptSettings()

  // 前端傳入的 character 優先覆蓋 DB 記憶（即時切換不需等 DB 更新）
  if (character) userMemory.selectedCharacter = character
  context = { ...context, userRole, userName, userMemory, isOwner: isUnlimited, promptSettings: promptSettings ?? undefined }

  // 老闆（platform_unlimited）或 super_admin 注入今日平台數據
  if (isUnlimited || userRole === 'super_admin') {
    context.platformStats = await getPlatformQuickStats()
  }

  const intent = classifyIntent(message, context)
  const provider = selectLLMProvider(intent)
  const selectedChar = context.userMemory?.selectedCharacter ?? 'yukirin'
  const rawPrompt = buildSystemPrompt(intent, context)
  // Author-framing 只在 Anthropic provider 套用（效果更好，且不浪費 OpenAI tokens）
  const systemPrompt = provider === 'anthropic'
    ? wrapWithAuthorFraming(selectedChar, rawPrompt)
    : rawPrompt

  const aiKey = getPlatformKey()
  if (!aiKey) {
    return new Response(
      JSON.stringify({ error: 'AI 服務暫時不可用' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const messages = [
    ...history.slice(-8),
    { role: 'user' as const, content: message },
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        send({ type: 'mood', mood: 'thinking' })

        let fullText = ''

        // ── Agent 模式（有工具呼叫意圖 + Anthropic key）────────────────────────
        const isAgentMessage = hasAgentIntent(message)
        if (isAgentMessage && provider === 'anthropic') {
          const anthropicKey = await getActiveAiKey('default')
          const agentKey = anthropicKey?.provider === 'anthropic' ? anthropicKey : null
          if (agentKey) {
            send({ type: 'agent_start', message: '雪凜正在查資料...' })
            const agentMessages = [
              ...messages.map((m: GuideMessage) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            ]
            const agentResult = await runAgentLoop(agentMessages, agentKey.apiKey, agentKey.model, systemPrompt)
            // 把步驟資訊傳給前端
            for (const step of agentResult.steps) {
              send({ type: 'tool_call', tool: step.toolName, durationMs: step.durationMs })
            }
            fullText = agentResult.finalText
            send({ type: 'chunk', text: fullText })
            const parsed = parseGuideResponse(fullText)
            send({
              type: 'complete',
              text: parsed.text || fullText,
              mood: parsed.mood ?? 'happy',
              animation: parsed.animation ?? null,
              action: parsed.action ?? null,
              quickReplies: parsed.quickReplies ?? null,
              agentSteps: agentResult.steps.length,
            })
            controller.close()
            return
          }
        }

        if (provider === 'anthropic') {
          const anthropicKey = await getActiveAiKey('default')
          const useKey = (anthropicKey?.provider === 'anthropic') ? anthropicKey : null

          if (useKey) {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': useKey.apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: useKey.model,
                system: systemPrompt,
                messages,
                max_tokens: 600,
                temperature: 0.8,
                stream: true,
              }),
            })

            if (!res.ok || !res.body) throw new Error('Anthropic stream failed')

            const reader = res.body.getReader()
            const dec = new TextDecoder()
            let buf = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += dec.decode(value, { stream: true })
              const lines = buf.split('\n')
              buf = lines.pop() ?? ''
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const raw = line.slice(6)
                if (raw === '[DONE]') continue
                try {
                  const evt = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string } }
                  if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                    fullText += evt.delta.text ?? ''
                    send({ type: 'chunk', text: evt.delta.text ?? '' })
                  }
                } catch { /* skip */ }
              }
            }
          } else {
            fullText = await callOpenAIStream(aiKey.apiKey, aiKey.model, systemPrompt, messages, (chunk) => {
              send({ type: 'chunk', text: chunk })
            })
          }
        } else {
          fullText = await callOpenAIStream(aiKey.apiKey, aiKey.model, systemPrompt, messages, (chunk) => {
            send({ type: 'chunk', text: chunk })
          })
        }

        const parsed = parseGuideResponse(fullText)

        send({
          type: 'complete',
          text: parsed.text,
          mood: parsed.mood,
          animation: parsed.animation ?? null,
          action: parsed.action ?? null,
          quickReplies: parsed.quickReplies ?? null,
          // 剩餘次數回傳給前端更新計數器
          isUnlimited,
          freeRemaining: isUnlimited ? null : quotaResult.freeRemaining,
          purchasedRemaining: isUnlimited ? null : quotaResult.purchasedRemaining,
        })

        // ── 記錄 AI 成本到 ai_cost_log ──────────────────────────────────
        try {
          const systemTokens = Math.ceil(systemPrompt.length / 3.5)
          const inputTokens = systemTokens + messages.reduce((s, m) => s + Math.ceil((m.content?.length ?? 0) / 3.5), 0)
          const outputTokens = Math.ceil(fullText.length / 3.5)
          const costPerInputK = aiKey.model.includes('gpt-4o-mini') ? 0.00015
            : aiKey.model.includes('gpt-4o') ? 0.0025
            : aiKey.model.includes('haiku') ? 0.00025
            : aiKey.model.includes('sonnet') ? 0.003
            : aiKey.model.includes('opus') ? 0.015
            : 0.00015
          const costPerOutputK = aiKey.model.includes('gpt-4o-mini') ? 0.0006
            : aiKey.model.includes('gpt-4o') ? 0.01
            : aiKey.model.includes('haiku') ? 0.00125
            : aiKey.model.includes('sonnet') ? 0.015
            : aiKey.model.includes('opus') ? 0.075
            : 0.0006
          const totalCost = (inputTokens / 1000) * costPerInputK + (outputTokens / 1000) * costPerOutputK
          await execute(
            `INSERT INTO ai_cost_log (user_id, model, intent_type, prompt_tokens, completion_tokens, total_cost_usd)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, aiKey.model, intent, inputTokens, outputTokens, totalCost]
          )
        } catch { /* 成本記錄失敗不影響主流程 */ }

        // ── 情侶互動觸發檢查 ──────────────────────────────────────────────
        const coupleCount = body.coupleCount ?? 0
        const lastCoupleAt = body.lastCoupleAt ?? 0
        const character = context.userMemory?.selectedCharacter ?? 'yukirin'

        if (shouldTriggerCoupleInteraction(intent, lastCoupleAt, coupleCount, false)) {
          try {
            const couplePrompt = buildCoupleInteractionPrompt(character, parsed.text, message, intent)
            const coupleRaw = await callOpenAISimple(aiKey.apiKey, aiKey.model, couplePrompt)
            const coupleJson = coupleRaw.match(/\{[\s\S]*\}/)?.[0]
            if (coupleJson) {
              const couple = JSON.parse(coupleJson) as {
                partnerLine?: string; partnerMood?: string
                activeLine?: string; activeMood?: string
              }
              send({
                type: 'couple_popup',
                partner: character === 'yukirin' ? 'riku' : 'yukirin',
                partnerLine: couple.partnerLine ?? '',
                partnerMood: couple.partnerMood ?? 'neutral',
                activeLine: couple.activeLine ?? '',
                activeMood: couple.activeMood ?? 'happy',
              })
            }
          } catch { /* 情侶互動非核心，失敗不影響主流程 */ }
        }

      } catch (err) {
        console.error('[guide/chat] Error:', err)
        send({
          type: 'complete',
          text: '欸嘿，我剛剛腦袋當機了一下 😅 可以再說一次嗎？',
          mood: 'surprised',
          action: null,
          isUnlimited,
          freeRemaining: isUnlimited ? null : quotaResult.freeRemaining,
          purchasedRemaining: isUnlimited ? null : quotaResult.purchasedRemaining,
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/** 非串流的短文字 AI 呼叫（用於情侶互動等次要功能） */
async function callOpenAISimple(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.9,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI couple error ${res.status}`)
  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}

async function callOpenAIStream(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: GuideMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.8,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) throw new Error(`OpenAI error ${res.status}`)

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') continue
      try {
        const evt = JSON.parse(raw) as { choices?: { delta?: { content?: string } }[] }
        const chunk = evt.choices?.[0]?.delta?.content ?? ''
        if (chunk) {
          fullText += chunk
          onChunk(chunk)
        }
      } catch { /* skip */ }
    }
  }

  return fullText
}

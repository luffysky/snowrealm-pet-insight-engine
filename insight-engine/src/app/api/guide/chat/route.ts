import { NextRequest } from 'next/server'
import { getPlatformKey, getActiveAiKey } from '@/lib/aiService'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { verifyToken } from '@/lib/jwt'
import { queryOne, execute } from '@/lib/db'
import {
  classifyIntent,
  selectLLMProvider,
  buildSystemPrompt,
  parseGuideResponse,
  GuideContext,
  GuideMessage,
} from '@/lib/guideEngine'

export const runtime = 'nodejs'

export const FREE_DAILY_LIMIT = 20

interface ChatRequest {
  message: string
  context?: GuideContext
  history?: GuideMessage[]
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
  if (token) {
    const payload = await verifyToken(token)
    userId = payload?.sub ?? null
  }

  // ── 特權帳號每次重新查 DB ─────────────────────────────────────────────────
  const isUnlimited = await isUserPlatformUnlimited(userId)

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
  const { message, context = {}, history = [] } = body

  const intent = classifyIntent(message, context)
  const provider = selectLLMProvider(intent)
  const systemPrompt = buildSystemPrompt(intent, context)

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

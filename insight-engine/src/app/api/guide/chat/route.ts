import { NextRequest } from 'next/server'
import { getPlatformKey, getActiveAiKey } from '@/lib/aiService'
import {
  classifyIntent,
  selectLLMProvider,
  buildSystemPrompt,
  parseGuideResponse,
  GuideContext,
  GuideMessage,
} from '@/lib/guideEngine'

export const runtime = 'nodejs'

interface ChatRequest {
  message: string
  context?: GuideContext
  history?: GuideMessage[]
}

export async function POST(req: NextRequest) {
  const body = await req.json() as ChatRequest
  const { message, context = {}, history = [] } = body

  // 意圖分類 + LLM 選擇
  const intent = classifyIntent(message, context)
  const provider = selectLLMProvider(intent)
  const systemPrompt = buildSystemPrompt(intent, context)

  // 取 AI Key（平台 key 即可，guide 不需要 tenant key）
  const aiKey = getPlatformKey()
  if (!aiKey) {
    return new Response(
      JSON.stringify({ error: 'AI 服務暫時不可用' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 組裝訊息（最近 8 輪歷史 + 本次輸入）
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
        // 立即送 thinking 表情（角色立刻有反應）
        send({ type: 'mood', mood: 'thinking' })

        let fullText = ''

        if (provider === 'anthropic') {
          // 嘗試用 Anthropic key，沒有就 fallback OpenAI
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
                } catch { /* skip malformed */ }
              }
            }
          } else {
            // Fallback to OpenAI
            fullText = await callOpenAIStream(aiKey.apiKey, aiKey.model, systemPrompt, messages, (chunk) => {
              send({ type: 'chunk', text: chunk })
            })
          }
        } else {
          // OpenAI streaming
          fullText = await callOpenAIStream(aiKey.apiKey, aiKey.model, systemPrompt, messages, (chunk) => {
            send({ type: 'chunk', text: chunk })
          })
        }

        // 解析完整回應（JSON 格式）
        const parsed = parseGuideResponse(fullText)

        // 送最終結果（含 mood, action, quickReplies）
        send({
          type: 'complete',
          text: parsed.text,
          mood: parsed.mood,
          action: parsed.action ?? null,
          quickReplies: parsed.quickReplies ?? null,
        })

      } catch (err) {
        console.error('[guide/chat] Error:', err)
        send({
          type: 'complete',
          text: '欸嘿，我剛剛腦袋當機了一下 😅 可以再說一次嗎？',
          mood: 'surprised',
          action: null,
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

import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireRole } from '@/lib/tenant'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface MessageRow extends Record<string, unknown> {
  sender_type: string
  content: string
}

interface TicketRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  subject: string | null
  category: string | null
}

function buildPrompt(subject: string | null, messages: MessageRow[]): string {
  const history = messages
    .map(m => `${m.sender_type === 'customer' ? '顧客' : '客服'}：${m.content}`)
    .join('\n')

  return `你是一位專業、友善的繁體中文客服助手。根據以下客服對話，生成一段簡潔的回覆建議（50 字以內，繁體中文，語氣友善自然）。

工單主題：${subject ?? '（未填寫）'}

對話紀錄：
${history}

請直接輸出回覆內容，不需要說明或前言。`
}

/**
 * POST /api/admin/support/[ticketId]/ai-suggest
 * 根據工單對話歷史，用 AI 生成回覆草稿
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { tenantId } = roleCheck
  const { ticketId } = await params

  if (!UUID_REGEX.test(ticketId)) {
    return NextResponse.json({ error: '無效的工單 ID 格式' }, { status: 400 })
  }

  const ticket = await queryOne<TicketRow>(
    `SELECT id, tenant_id, subject, category FROM support_tickets WHERE id = $1 AND tenant_id = $2`,
    [ticketId, tenantId]
  )
  if (!ticket) {
    return NextResponse.json({ error: '找不到該工單' }, { status: 404 })
  }

  const messages = await query<MessageRow>(
    `SELECT sender_type, content FROM support_messages
     WHERE ticket_id = $1 ORDER BY created_at ASC LIMIT 20`,
    [ticketId]
  )

  if (messages.length === 0) {
    return NextResponse.json({ error: '工單尚無訊息' }, { status: 400 })
  }

  const aiKey = await getActiveAiKey(tenantId) ?? getPlatformKey()
  if (!aiKey) {
    return NextResponse.json({ error: '無可用的 AI Key，請先在 AI 設定中設定' }, { status: 503 })
  }

  const prompt = buildPrompt(ticket.subject, messages)

  try {
    let suggestion = ''
    let promptTokens = 0
    let completionTokens = 0

    if (aiKey.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': aiKey.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model,
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as {
        content: { text: string }[]
        usage: { input_tokens: number; output_tokens: number }
      }
      suggestion = data.content?.[0]?.text?.trim() ?? ''
      promptTokens = data.usage?.input_tokens ?? 0
      completionTokens = data.usage?.output_tokens ?? 0
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiKey.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiKey.model,
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json() as {
        choices: { message: { content: string } }[]
        usage: { prompt_tokens: number; completion_tokens: number }
      }
      suggestion = data.choices?.[0]?.message?.content?.trim() ?? ''
      promptTokens = data.usage?.prompt_tokens ?? 0
      completionTokens = data.usage?.completion_tokens ?? 0
    }

    if (!suggestion) {
      return NextResponse.json({ error: 'AI 未回傳有效建議' }, { status: 502 })
    }

    after(() => logAiUsage({
      tenantId,
      action: 'sentiment' as Parameters<typeof logAiUsage>[0]['action'],
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      promptTokens,
      completionTokens,
      isFree: aiKey.keySource === 'platform_key',
    }))

    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error('[support/ai-suggest POST]', err)
    return NextResponse.json({ error: 'AI 建議生成失敗' }, { status: 500 })
  }
}

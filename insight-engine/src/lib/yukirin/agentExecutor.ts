/**
 * 雪凜 Agent Executor
 * 處理 Claude Tool Use 多輪工具呼叫 loop，直到 Claude 決定停止
 *
 * 流程：
 *   1. 帶入 AGENT_TOOLS_SCHEMA + 對話歷史，送給 Claude
 *   2. Claude 回傳 tool_use → 執行對應工具 → 把結果送回 Claude
 *   3. 重複直到 Claude 回傳 stop_reason = 'end_turn'（或達到最大步數）
 *   4. 回傳最終文字回覆
 */

import { AGENT_TOOLS_SCHEMA, executeTool } from './agentTools'

const MAX_STEPS = 5  // 防止無限循環

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContent[]
}

type AnthropicContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string }

export interface AgentStep {
  toolName: string
  input: Record<string, unknown>
  result: unknown
  durationMs: number
}

export interface AgentResult {
  finalText: string
  steps: AgentStep[]
  totalSteps: number
  stopped: 'end_turn' | 'max_steps' | 'error'
}

/**
 * 執行 Agent Loop
 * @param messages     完整對話歷史（含最新的使用者訊息）
 * @param apiKey       Anthropic API Key
 * @param model        Claude model ID
 * @param systemPrompt 雪凜人設 system prompt
 */
export async function runAgentLoop(
  messages: AgentMessage[],
  apiKey: string,
  model: string,
  systemPrompt: string,
): Promise<AgentResult> {
  const steps: AgentStep[] = []
  let currentMessages = [...messages]
  let stopped: AgentResult['stopped'] = 'end_turn'

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await callClaude(currentMessages, apiKey, model, systemPrompt)

    if (response.stop_reason === 'end_turn' || !response.content?.some((c: AnthropicContent) => c.type === 'tool_use')) {
      // Claude 決定停止，提取最終文字
      const finalText = response.content
        ?.filter((c: AnthropicContent) => c.type === 'text')
        .map((c: AnthropicContent) => (c as { type: 'text'; text: string }).text)
        .join('') ?? ''

      return { finalText, steps, totalSteps: steps.length, stopped: 'end_turn' }
    }

    // Claude 想呼叫工具
    const assistantContent: AnthropicContent[] = response.content ?? []
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: assistantContent },
    ]

    // 執行所有工具呼叫（可能同時有多個）
    const toolResults: AnthropicContent[] = []
    for (const block of assistantContent) {
      if (block.type !== 'tool_use') continue

      const toolBlock = block as { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      const t0 = Date.now()
      const result = await executeTool(toolBlock.name, toolBlock.input)
      const durationMs = Date.now() - t0

      steps.push({
        toolName: toolBlock.name,
        input: toolBlock.input,
        result: result.data ?? result.error,
        durationMs,
      })

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: result.success
          ? JSON.stringify(result.data)
          : `Error: ${result.error}`,
      })
    }

    // 把工具結果加入對話
    currentMessages = [
      ...currentMessages,
      { role: 'user', content: toolResults },
    ]

    if (step === MAX_STEPS - 1) {
      stopped = 'max_steps'
    }
  }

  // 最大步數到了，再問一次讓 Claude 整合結果
  const finalResponse = await callClaude(currentMessages, apiKey, model, systemPrompt)
  const finalText = finalResponse.content
    ?.filter((c: AnthropicContent) => c.type === 'text')
    .map((c: AnthropicContent) => (c as { type: 'text'; text: string }).text)
    .join('') ?? '（處理完成，但步數超出限制）'

  return { finalText, steps, totalSteps: steps.length, stopped }
}

/** 呼叫 Anthropic API（帶工具定義） */
async function callClaude(
  messages: AgentMessage[],
  apiKey: string,
  model: string,
  systemPrompt: string,
): Promise<{ stop_reason: string; content: AnthropicContent[] }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      tools: AGENT_TOOLS_SCHEMA,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } }
    throw new Error(err.error?.message ?? `Claude API error ${res.status}`)
  }

  return res.json() as Promise<{ stop_reason: string; content: AnthropicContent[] }>
}

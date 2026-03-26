'use client'

import { useState, useRef, useEffect } from 'react'
import { parseSurveyJson, type AiGeneratedSurvey } from '@/lib/aiSurveyPrompt'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AiSurveyChatProps {
  onDone: (surveyId: string) => void
  onCancel: () => void
}

// ===== 建立問卷的 API 呼叫 =====

async function createSurveyFromAi(data: AiGeneratedSurvey): Promise<string> {
  // 1. 建立問卷（title + slug）
  const createRes = await fetch('/api/admin/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.survey.title,
      slug: data.survey.slug,
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.json() as { error?: string }
    throw new Error(err.error ?? '建立問卷失敗')
  }

  const survey = await createRes.json() as { id: string }
  const surveyId = survey.id

  // 2. 更新問卷其他欄位（subtitle, cover, branching...）
  const patchBody: Record<string, unknown> = {
    subtitle: data.survey.subtitle,
    cover_title: data.survey.coverTitle,
    cover_subtitle: data.survey.coverSubtitle,
    start_button_text: data.survey.startButtonText,
    done_title: data.survey.doneTitle,
    done_subtitle: data.survey.doneSubtitle,
  }

  if (data.branching?.enabled && data.branching.branchKey) {
    patchBody.branch_config = {
      branchKey: data.branching.branchKey,
      routes: data.branching.routes,
    }
  }

  if (data.resultConfig) {
    patchBody.result_config = data.resultConfig
  }

  await fetch(`/api/admin/surveys/${surveyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchBody),
  })

  // 3. 依序建立題目
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i]
    await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: q.key,
        type: q.type,
        content: q.content,
        options: q.options?.map((opt) => ({
          label: opt.label,
          value: opt.value,
          emoji: opt.emoji ?? '',
        })) ?? [],
        order_index: i,
        is_required: q.isRequired,
        route: q.route ?? 'all',
        max_selections: q.maxSelections ?? null,
      }),
    })
  }

  return surveyId
}

// ===== 移除 SURVEY_JSON 標記，只保留對話文字 =====

function stripSurveyJson(text: string): string {
  return text.replace(/<SURVEY_JSON>[\s\S]*?<\/SURVEY_JSON>/g, '').trim()
}

// ===== Prompt 靈感資料 =====

const PROMPT_INSPIRATIONS = [
  { icon: '🪞', label: '朋友眼中的你', prompt: '幫我設計一份「朋友眼中的你」人格測驗，10題，每題4個選項，結果要有有趣的稱號，讓人想截圖分享' },
  { icon: '💕', label: '戀愛致命弱點', prompt: '設計一份「你的戀愛致命弱點」測驗，10題，有點刺但不傷人，結果要讓人覺得被看穿然後忍不住傳給朋友' },
  { icon: '🐾', label: '你是哪種動物', prompt: '設計一份「你是哪種動物」娛樂型人格測驗，10題，簡短有趣，結果是具象的動物角色，適合做成故事卡分享' },
  { icon: '😈', label: '隱藏黑暗面', prompt: '設計一份「你的隱藏黑暗人格」測驗，10題，有心理測驗感但不嚴肅，結果是暗黑角色如「溫柔系操控者」' },
  { icon: '💼', label: '職場人設保質期', prompt: '設計一份「你的職場人設能撐到幾歲」測驗，8題，帶黑色幽默，結果告訴你人設保質期和崩塌預兆' },
  { icon: '🔮', label: '未來人生路線', prompt: '設計一份「你的未來人生路線」預測型測驗，10題，題目有畫面感，結果是一段微小說描述你的人生劇本' },
  { icon: '✨', label: '隱藏天賦', prompt: '設計一份「你被低估的隱藏實力」測驗，10題，結果要具體不空洞，讓人覺得「終於有人懂我」' },
  { icon: '🤝', label: '朋友契合度', prompt: '設計一份「跟我當朋友你能撐多久」友誼測驗，8題，帶點挑釁但好笑，結果用百分比加一句毒舌評語' },
  { icon: '🥶', label: '關係變淡了？', prompt: '設計一份「我們是不是在變淡了？」的關係體溫計，8題，題目有情境感，結果是關係溫度+AI診斷+回溫建議' },
  { icon: '😤', label: '你忍了我什麼', prompt: '設計一份「你忍了我哪些事？」匿名真心話問卷，8題，讓人有安全感才敢說真話，結果彙整成大家想說的話' },
  { icon: '👀', label: '第一印象反差', prompt: '設計一份「第一印象vs真正的你」反差測驗，10題，前5題測別人眼中的你，後5題測真正的你，結果呈現反差感' },
  { icon: '🏢', label: '公司不敢說的話', prompt: '設計一份「公司裡大家不敢說的真話」匿名調查，8題，題目包含最大問題、效率卡點、想離開的原因，結果有問題排名' },
  { icon: '💑', label: '情侶吵架', prompt: '設計一份「你們吵架時誰比較可怕」情侶測驗，8題，有趣不引戰，兩個人分別填再對比結果' },
]

// ===== 主元件 =====

export function AiSurveyChat({ onDone, onCancel }: AiSurveyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 AI 問卷設計顧問。請告訴我你想設計什麼樣的問卷？（主題、目的、目標受眾都可以描述）',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [detectedSurvey, setDetectedSurvey] = useState<AiGeneratedSurvey | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showAllInspirations, setShowAllInspirations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ]
    setMessages(newMessages)
    setInput('')
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/admin/ai-chat-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json() as { reply?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'AI 回覆失敗')
        return
      }

      const reply = data.reply ?? ''
      setMessages([...newMessages, { role: 'assistant', content: reply }])

      // 偵測是否包含問卷 JSON
      const parsed = parseSurveyJson(reply)
      if (parsed) setDetectedSurvey(parsed)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setSending(false)
    }
  }

  async function handleCreate() {
    if (!detectedSurvey) return
    setCreating(true)
    setCreateError('')

    try {
      const surveyId = await createSurveyFromAi(detectedSurvey)
      onDone(surveyId)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '建立失敗')
    } finally {
      setCreating(false)
    }
  }

  function handleRedesign() {
    setDetectedSurvey(null)
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: '請重新設計這份問卷' },
    ])
    // 觸發重新生成
    setSending(true)
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: '請重新設計這份問卷' },
    ]
    fetch('/api/admin/ai-chat-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages }),
    })
      .then((r) => r.json())
      .then((data: { reply?: string; error?: string }) => {
        const reply = data.reply ?? ''
        setMessages([...updatedMessages, { role: 'assistant', content: reply }])
        const parsed = parseSurveyJson(reply)
        if (parsed) setDetectedSurvey(parsed)
      })
      .catch(() => setError('AI 回覆失敗'))
      .finally(() => setSending(false))
  }

  const inputClass =
    'flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none'

  return (
    <div className="bg-slate-800/80 border border-cyan-500/20 rounded-xl overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          ✨ AI 對話建立問卷
        </h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
        >
          ✕ 關閉
        </button>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="h-96 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => {
          const displayContent =
            msg.role === 'assistant' ? stripSurveyJson(msg.content) : msg.content

          if (!displayContent && msg.role === 'assistant') {
            return (
              <div key={i} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-slate-700/60 rounded-xl px-4 py-3 text-sm text-cyan-400/80">
                  ✅ AI 已完成問卷設計，請查看下方預覽
                </div>
              </div>
            )
          }

          return (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-t-btn text-white'
                    : 'bg-slate-700/60 text-white/85'
                }`}
              >
                {displayContent}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  👤
                </div>
              )}
            </div>
          )
        })}

        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="bg-slate-700/60 rounded-xl px-4 py-3 text-sm text-white/50">
              思考中...
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Survey preview (when JSON detected) */}
      {detectedSurvey && (
        <div className="mx-6 mb-4 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm">
            ✅ 問卷設計完成
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-400">標題：</span>
              <span className="text-white">{detectedSurvey.survey.title}</span>
            </div>
            <div>
              <span className="text-slate-400">Slug：</span>
              <span className="text-white/70 font-mono text-xs">{detectedSurvey.survey.slug}</span>
            </div>
            <div>
              <span className="text-slate-400">題數：</span>
              <span className="text-white">{detectedSurvey.questions.length} 題</span>
            </div>
            <div>
              <span className="text-slate-400">主題：</span>
              <span className="text-white">{detectedSurvey.survey.theme}</span>
            </div>
            {detectedSurvey.branching?.enabled && (
              <div className="col-span-2">
                <span className="text-slate-400">分流：</span>
                <span className="text-cyan-400">已設定（依 {detectedSurvey.branching.branchKey} 分流）</span>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500">
            題型分佈：
            {['single', 'multiple', 'text'].map((t) => {
              const count = detectedSurvey.questions.filter((q) => q.type === t).length
              if (count === 0) return null
              const labels: Record<string, string> = { single: '單選', multiple: '多選', text: '文字' }
              return (
                <span key={t} className="ml-2">
                  {labels[t]} ×{count}
                </span>
              )
            })}
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-all cursor-pointer font-medium"
            >
              {creating ? '建立中...' : '🚀 確認建立問卷'}
            </button>
            <button
              onClick={handleRedesign}
              disabled={sending || creating}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-lg text-sm cursor-pointer"
            >
              重新設計
            </button>
          </div>
        </div>
      )}

      {/* Prompt 靈感按鈕（僅在對話初始時顯示） */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2">
          <p className="text-xs text-slate-400 mb-2">💡 不知道怎麼開始？試試這些：</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_INSPIRATIONS.slice(0, showAllInspirations ? undefined : 8).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setInput(p.prompt)}
                className="px-3 py-1.5 text-xs bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 rounded-full transition-colors cursor-pointer"
              >
                {p.icon} {p.label}
              </button>
            ))}
            {!showAllInspirations && PROMPT_INSPIRATIONS.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllInspirations(true)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                查看更多 ▼
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="描述你的問卷需求... （Enter 送出，Shift+Enter 換行）"
          rows={2}
          disabled={sending || creating}
          className={inputClass}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || creating}
          className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:opacity-40 text-white rounded-lg text-sm transition-colors cursor-pointer self-end"
        >
          送出
        </button>
      </div>
    </div>
  )
}

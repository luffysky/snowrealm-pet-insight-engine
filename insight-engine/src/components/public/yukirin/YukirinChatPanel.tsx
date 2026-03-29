'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { YukirinControls, YukirinMood } from './YukirinScene'
import type { GuideAction, GuideMessage } from '@/lib/guideEngine'

const YukirinScene = dynamic(() => import('./YukirinScene'), { ssr: false })

// ── 快捷按鈕列 ────────────────────────────────────────────────────────────
const DEFAULT_QUICK_REPLIES = ['帶我逛逛', '功能怎麼用', '找我聊天']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  mood?: YukirinMood
}

interface YukirinChatPanelProps {
  onClose: () => void
}

export default function YukirinChatPanel({ onClose }: YukirinChatPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const yukirinRef = useRef<YukirinControls | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: '嗨嗨！我是雪凜～ 有什麼我可以幫你的嗎？',
      mood: 'happy',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES)

  // 捲到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleLoad = useCallback((controls: YukirinControls) => {
    yukirinRef.current = controls
  }, [])

  // 執行 LLM 回傳的 UI action
  const executeAction = useCallback((action: GuideAction) => {
    switch (action.type) {
      case 'navigate':
        router.push(action.target)
        break
      case 'scroll': {
        const el = document.querySelector(action.target)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
      case 'highlight': {
        const el = document.querySelector(action.target) as HTMLElement | null
        if (el) {
          el.style.transition = 'box-shadow 0.3s'
          el.style.boxShadow = '0 0 0 3px rgba(184,169,232,0.8)'
          setTimeout(() => { el.style.boxShadow = '' }, 2500)
        }
        break
      }
      case 'show_survey':
        router.push(`/survey/${action.surveyId}`)
        break
    }
  }, [router])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setStreamingText('')
    setQuickReplies([])

    // 組裝歷史（只送 role + content）
    const history: GuideMessage[] = messages.slice(-8).map(m => ({
      role: m.role,
      content: m.text,
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: { currentPage: pathname ?? '/' },
          history,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let accText = ''
      let finalMood: YukirinMood = 'happy'
      let finalAction: GuideAction | null = null
      let finalQuickReplies: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6)) as {
              type: string
              mood?: YukirinMood
              text?: string
              chunk?: string
              action?: GuideAction | null
              quickReplies?: string[] | null
            }

            if (evt.type === 'mood' && evt.mood) {
              yukirinRef.current?.setMood(evt.mood, 300)
              finalMood = evt.mood
            }

            if (evt.type === 'chunk' && evt.text) {
              accText += evt.text
              // LLM 回傳 JSON，串流時直接顯示「...」，完成後再顯示解析結果
              setStreamingText('...')
            }

            if (evt.type === 'complete') {
              if (evt.mood) {
                yukirinRef.current?.setMood(evt.mood, 400)
                finalMood = evt.mood
              }
              if (evt.text) accText = evt.text
              if (evt.action) finalAction = evt.action
              if (evt.quickReplies) finalQuickReplies = evt.quickReplies
            }
          } catch { /* skip */ }
        }
      }

      setStreamingText('')
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: accText || '欸嘿，我想了一下沒想出來 😅',
        mood: finalMood,
      }
      setMessages(prev => [...prev, assistantMsg])

      if (finalAction) executeAction(finalAction)
      setQuickReplies(finalQuickReplies.length > 0 ? finalQuickReplies : DEFAULT_QUICK_REPLIES)

    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setStreamingText('')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: '欸嘿，我剛剛腦袋當機了一下 😅',
        mood: 'surprised',
      }])
      setQuickReplies(DEFAULT_QUICK_REPLIES)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, pathname, executeAction])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  const handleQuickReply = useCallback((text: string) => {
    sendMessage(text)
  }, [sendMessage])

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-white/10"
      style={{ width: 288, height: 460, background: 'rgba(15,9,30,0.92)', backdropFilter: 'blur(20px)' }}
      // 阻止點擊/指針事件冒泡到 widget 拖曳層
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* ── 雪凜 3D 頭像區 ─────────────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ height: 130 }}>
        <div className="absolute inset-0">
          <YukirinScene
            cameraMode="upperBody"
            mood="happy"
            showBackground={false}
            onLoad={handleLoad}
            className="w-full h-full"
          />
        </div>
        {/* 頂部標題列 */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-2.5 pointer-events-none">
          <div>
            <span className="text-white/90 text-xs font-semibold drop-shadow">雪凜</span>
            <span className="text-white/40 text-[10px] ml-1.5">AI 嚮導</span>
          </div>
          <button
            onClick={onClose}
            className="pointer-events-auto w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors text-[10px]"
          >
            ✕
          </button>
        </div>
        {/* 漸層遮罩，讓頭像下方與訊息區融合 */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,9,30,0.92))' }}
        />
      </div>

      {/* ── 訊息列表 ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`text-xs leading-relaxed px-3 py-2 rounded-2xl max-w-[80%] ${
                msg.role === 'assistant'
                  ? 'text-white/85 border border-[#b8a9e8]/20 rounded-bl-sm'
                  : 'text-white/85 border border-white/15 rounded-br-sm'
              }`}
              style={
                msg.role === 'assistant'
                  ? { background: 'rgba(184,169,232,0.10)' }
                  : { background: 'linear-gradient(135deg, rgba(184,169,232,0.2), rgba(245,184,181,0.15))' }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* 串流中：顯示思考點點 */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="text-xs px-3 py-2 rounded-2xl rounded-bl-sm border border-[#b8a9e8]/20"
              style={{ background: 'rgba(184,169,232,0.10)' }}
            >
              <span className="inline-flex gap-0.5 items-center text-white/40">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 快捷回覆按鈕 ──────────────────────────────────── */}
      {quickReplies.length > 0 && !isLoading && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {quickReplies.map(qr => (
            <button
              key={qr}
              onClick={() => handleQuickReply(qr)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[#b8a9e8]/30 text-[#c8b8f0] hover:bg-[#b8a9e8]/15 transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* ── 輸入區 ────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/8"
        onPointerDown={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="跟雪凜說點什麼..."
          disabled={isLoading}
          className="flex-1 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-[#b8a9e8]/40 transition-colors disabled:opacity-50"
          style={{ fontSize: 12 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #b8a9e8, #f5b8b5)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
            <path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

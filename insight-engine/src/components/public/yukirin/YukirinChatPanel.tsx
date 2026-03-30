'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { YukirinControls, YukirinMood } from './YukirinScene'
import type { GuideAction, GuideMessage } from '@/lib/guideEngine'
import { getFallbackResponse } from '@/lib/guideFallbacks'

const YukirinScene = dynamic(() => import('./YukirinScene'), { ssr: false })

const DEFAULT_QUICK_REPLIES = ['帶我逛逛', '功能怎麼用', '找我聊天']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  mood?: YukirinMood
}

interface TurnsInfo {
  isUnlimited: boolean
  freeRemaining: number | null
  purchasedCredits: number | null
  zcoinBalance: number | null
  isLoggedIn?: boolean
}

interface YukirinChatPanelProps {
  onClose: () => void
}

// ── 購買次數面板 ──────────────────────────────────────────────────────────────
function BuyTurnsPanel({
  zcoinBalance,
  isLoggedIn,
  onBought,
  onClose,
}: {
  zcoinBalance: number | null
  isLoggedIn: boolean
  onBought: (addedTurns: number, newBalance: number, totalCredits: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const packs: { key: 's' | 'm' | 'l'; zcoins: number; turns: number; label: string; badge?: string }[] = [
    { key: 's', zcoins: 5,  turns: 20,  label: '20 次' },
    { key: 'm', zcoins: 10, turns: 50,  label: '50 次' },
    { key: 'l', zcoins: 20, turns: 120, label: '120 次', badge: '最划算' },
  ]

  const handleBuy = async (pack: 's' | 'm' | 'l') => {
    if (!isLoggedIn) { setError('請先登入帳號才能購買～'); return }
    setLoading(pack)
    setError('')
    try {
      const res = await fetch('/api/guide/buy-turns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '購買失敗，請稍後再試'); return }
      onBought(data.addedTurns, data.newZcoinBalance, data.totalCredits)
    } catch {
      setError('網路錯誤，請再試一次')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="px-3 pb-3 pt-2 border-t border-white/8"
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/70">💬 今日免費次數已用完</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs">略過</button>
      </div>
      <p className="text-[10px] text-white/40 mb-2.5">
        用 Z幣 換更多對話次數吧～
        {zcoinBalance !== null && <span className="text-[#b8a9e8] ml-1">（你有 {zcoinBalance} Z幣）</span>}
      </p>

      {!isLoggedIn && (
        <p className="text-[10px] text-amber-400 mb-2">⚠️ 請先登入才能使用 Z幣</p>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {packs.map(p => {
          const canAfford = zcoinBalance !== null && zcoinBalance >= p.zcoins
          return (
            <button
              key={p.key}
              onClick={() => handleBuy(p.key)}
              disabled={!!loading || !isLoggedIn || !canAfford}
              className="relative flex-1 min-w-0 py-2 px-1.5 rounded-xl border text-center transition-all disabled:opacity-40"
              style={{
                background: canAfford && isLoggedIn ? 'rgba(184,169,232,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: canAfford && isLoggedIn ? 'rgba(184,169,232,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {p.badge && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-[#b8a9e8] text-black rounded-full px-1.5 py-0 font-bold whitespace-nowrap">
                  {p.badge}
                </span>
              )}
              <div className="text-[11px] font-bold text-white/80 mt-0.5">
                {loading === p.key ? '...' : p.label}
              </div>
              <div className="text-[9px] text-[#b8a9e8] mt-0.5">{p.zcoins} Z幣</div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}

const MAX_MESSAGES = 100

/** 加入新訊息，超過 MAX_MESSAGES 時循環覆蓋最舊的（保留第 0 筆初始問候） */
function appendMessage(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (prev.length >= MAX_MESSAGES) {
    // 保留 index 0（初始問候），移除最舊的 user/assistant 那筆
    return [...prev.slice(1), msg]
  }
  return [...prev, msg]
}

// ── 主元件 ───────────────────────────────────────────────────────────────────
export default function YukirinChatPanel({ onClose }: YukirinChatPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const yukirinRef = useRef<YukirinControls | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  // 次數狀態
  const [turnsInfo, setTurnsInfo] = useState<TurnsInfo | null>(null)
  const [showBuyPanel, setShowBuyPanel] = useState(false)

  // 捲到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // 開啟時查詢剩餘次數（每次打開都重查）
  useEffect(() => {
    fetch('/api/guide/turns')
      .then(r => r.json())
      .then((data: TurnsInfo) => setTurnsInfo(data))
      .catch(() => {})
  }, [])

  const handleLoad = useCallback((controls: YukirinControls) => {
    yukirinRef.current = controls
  }, [])

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
    setMessages(prev => appendMessage(prev, userMsg))
    setInput('')
    setIsLoading(true)
    setStreamingText('')
    setQuickReplies([])

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

      // 次數用完 → 顯示購買面板
      if (res.status === 402) {
        const data = await res.json()
        setTurnsInfo(prev => prev
          ? { ...prev, freeRemaining: 0, purchasedCredits: 0, isLoggedIn: data.isLoggedIn }
          : { isUnlimited: false, freeRemaining: 0, purchasedCredits: 0, zcoinBalance: null, isLoggedIn: data.isLoggedIn }
        )
        yukirinRef.current?.setMood('sad', 300)
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: '欸嘿，今天的次數用完了 😴 用 Z幣 換更多對話吧～',
          mood: 'sad',
        }))
        setShowBuyPanel(true)
        return
      }

      // AI 暫時不可用 → 備用腳本
      if (res.status === 503) {
        const fallback = getFallbackResponse(text)
        yukirinRef.current?.setMood(fallback.mood, 300)
        setStreamingText('')
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: fallback.text,
          mood: fallback.mood,
        }))
        setQuickReplies(fallback.quickReplies ?? DEFAULT_QUICK_REPLIES)
        return
      }

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
              isUnlimited?: boolean
              freeRemaining?: number | null
              purchasedRemaining?: number | null
            }

            if (evt.type === 'mood' && evt.mood) {
              yukirinRef.current?.setMood(evt.mood, 300)
              finalMood = evt.mood
            }

            if (evt.type === 'chunk' && evt.text) {
              accText += evt.text
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

              // 更新次數顯示
              if (!evt.isUnlimited && evt.freeRemaining !== undefined) {
                setTurnsInfo(prev => prev ? {
                  ...prev,
                  freeRemaining: evt.freeRemaining ?? null,
                  purchasedCredits: evt.purchasedRemaining ?? prev.purchasedCredits,
                } : null)
              }
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
      setMessages(prev => appendMessage(prev, assistantMsg))

      if (finalAction) executeAction(finalAction)
      setQuickReplies(finalQuickReplies.length > 0 ? finalQuickReplies : DEFAULT_QUICK_REPLIES)

    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setStreamingText('')
      const fallback = getFallbackResponse(text)
      yukirinRef.current?.setMood(fallback.mood, 300)
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: fallback.text,
        mood: fallback.mood,
      }))
      setQuickReplies(fallback.quickReplies ?? DEFAULT_QUICK_REPLIES)
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

  const handleBought = useCallback((addedTurns: number, newBalance: number, totalCredits: number) => {
    setTurnsInfo(prev => prev ? {
      ...prev,
      purchasedCredits: totalCredits,
      zcoinBalance: newBalance,
    } : null)
    setShowBuyPanel(false)
    yukirinRef.current?.setMood('excited', 300)
    setMessages(prev => appendMessage(prev, {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      text: `欸嘿！成功換到 ${addedTurns} 次對話了 🎉 繼續聊吧～`,
      mood: 'excited',
    }))
    setQuickReplies(DEFAULT_QUICK_REPLIES)
  }, [])

  // 次數倒數顯示文字
  const turnsLabel = (() => {
    if (!turnsInfo || turnsInfo.isUnlimited) return null
    const free = turnsInfo.freeRemaining ?? 0
    const bought = turnsInfo.purchasedCredits ?? 0
    if (free > 0) return { text: `💬 免費 ${free} / 20`, color: free <= 5 ? 'text-amber-400' : 'text-white/30' }
    if (bought > 0) return { text: `💎 購買 ${bought} 次`, color: 'text-[#b8a9e8]' }
    return { text: '💬 次數已用完', color: 'text-red-400' }
  })()

  const isInputDisabled = isLoading || (
    !turnsInfo?.isUnlimited &&
    turnsInfo !== null &&
    (turnsInfo.freeRemaining ?? 0) <= 0 &&
    (turnsInfo.purchasedCredits ?? 0) <= 0
  )

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-white/10"
      style={{ width: 288, height: 460, background: 'rgba(15,9,30,0.92)', backdropFilter: 'blur(20px)' }}
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
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-2.5 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 pointer-events-none">
            <svg width="8" height="10" viewBox="0 0 8 10" fill="rgba(255,255,255,0.2)">
              <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
              <circle cx="2" cy="5" r="1"/><circle cx="6" cy="5" r="1"/>
              <circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/>
            </svg>
            <span className="text-white/90 text-xs font-semibold drop-shadow">雪凜</span>
            <span className="text-white/40 text-[10px]">AI 嚮導</span>
          </div>
          <button
            onClick={onClose}
            onPointerDown={e => e.stopPropagation()}
            className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors text-[10px]"
          >
            ✕
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,9,30,0.92))' }}
        />
      </div>

      {/* ── 訊息列表 ───────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10"
        onPointerDown={e => e.stopPropagation()}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

      {/* ── 快捷回覆 ──────────────────────────────────────── */}
      {quickReplies.length > 0 && !isLoading && !showBuyPanel && (
        <div className="px-3 pb-1.5 flex gap-1.5 flex-wrap" onPointerDown={e => e.stopPropagation()}>
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

      {/* ── 次數倒數 chip ─────────────────────────────────── */}
      {turnsLabel && !showBuyPanel && (
        <div
          className="px-3 pb-1 flex items-center justify-between"
          onPointerDown={e => e.stopPropagation()}
        >
          <span className={`text-[10px] ${turnsLabel.color}`}>{turnsLabel.text}</span>
          {(turnsInfo?.freeRemaining ?? 1) <= 0 && (turnsInfo?.purchasedCredits ?? 0) <= 0 && (
            <button
              onClick={() => setShowBuyPanel(true)}
              className="text-[10px] text-[#b8a9e8] hover:text-white transition-colors"
            >
              Z幣購買 →
            </button>
          )}
        </div>
      )}

      {/* ── 購買面板 或 輸入區 ─────────────────────────────── */}
      {showBuyPanel ? (
        <BuyTurnsPanel
          zcoinBalance={turnsInfo?.zcoinBalance ?? null}
          isLoggedIn={turnsInfo?.isLoggedIn ?? false}
          onBought={handleBought}
          onClose={() => setShowBuyPanel(false)}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/8"
          onPointerDown={e => e.stopPropagation()}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isInputDisabled && !isLoading ? '次數已用完，請購買或明天再來' : '跟雪凜說點什麼...'}
            disabled={isInputDisabled}
            className="flex-1 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-[#b8a9e8]/40 transition-colors disabled:opacity-50"
            style={{ fontSize: 12 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isInputDisabled}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #b8a9e8, #f5b8b5)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  isMine: boolean
  fromName: string | null
  fromAvatar: string | null
}

interface SSEMessage {
  type: 'messages' | 'ping'
  messages?: {
    id: string
    content: string
    createdAt: string
    fromUserId: string
    fromName: string | null
    fromAvatar: string | null
  }[]
}

interface DMButtonProps {
  targetUserId: string
  targetName: string
  targetAvatar?: string
}

export function DMButton({ targetUserId, targetName, targetAvatar }: DMButtonProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  // Fetch own userId once
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() as Promise<{ userId: string }> : null)
      .then(d => { if (d?.userId) setMeId(d.userId) }).catch(() => {})
  }, [])

  // Load initial messages + SSE for real-time
  useEffect(() => {
    if (!open || !meId) return
    setLoading(true)

    // Initial load
    fetch(`/api/admin/social/messages/${targetUserId}`)
      .then(r => r.ok ? r.json() as Promise<{ messages: Message[] }> : null)
      .then(d => { if (d?.messages) setMessages(d.messages) })
      .catch(() => {})
      .finally(() => setLoading(false))

    // SSE for real-time updates
    const lastMsg = messages[messages.length - 1]
    const url = `/api/admin/social/messages/sse?userId=${targetUserId}${lastMsg ? `&lastId=${lastMsg.id}` : ''}`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as SSEMessage
        if (data.type === 'messages' && data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = data.messages!
              .filter(m => !existingIds.has(m.id))
              .map(m => ({
                id: m.id,
                content: m.content,
                createdAt: m.createdAt,
                isMine: m.fromUserId === meId,
                fromName: m.fromName,
                fromAvatar: m.fromAvatar,
              }))
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
          })
        }
      } catch { /* ignore */ }
    }

    return () => { es.close(); esRef.current = null }
  }, [open, targetUserId, meId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId, content: text }),
      })
      if (res.ok) {
        const data = await res.json() as { message: { id: string; createdAt: string } }
        // Optimistically add message
        setMessages(prev => [...prev, {
          id: data.message.id,
          content: text,
          createdAt: data.message.createdAt,
          isMine: true,
          fromName: null,
          fromAvatar: null,
        }])
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  const initials = targetName.slice(0, 2).toUpperCase()
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <button
        onClick={() => setOpen(s => !s)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white/8 border border-white/12 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/12 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        私訊
      </button>

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 flex flex-col bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden shrink-0">
              {targetAvatar ? <img src={targetAvatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white/80 truncate block">{targetName}</span>
              <span className="text-[10px] text-emerald-400/60">● 即時訊息</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && messages.length === 0 && (
              <div className="flex justify-center pt-8">
                <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
              </div>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-center text-xs text-white/25 pt-8">開始對話吧 👋</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  msg.isMine
                    ? 'bg-amber-500/25 text-amber-100 rounded-br-sm'
                    : 'bg-white/8 text-white/75 rounded-bl-sm'
                }`}>
                  <p className="break-words leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${msg.isMine ? 'text-amber-300/50 text-right' : 'text-white/30'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/8 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="輸入訊息... (Enter 送出)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="p-1.5 bg-amber-500/25 border border-amber-400/30 rounded-xl text-amber-300 hover:bg-amber-500/35 transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

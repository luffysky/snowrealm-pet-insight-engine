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
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/social/messages/${targetUserId}`)
      if (res.ok) {
        const data = await res.json() as { messages: Message[] }
        setMessages(data.messages)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))
    pollRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId, content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages()
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
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
            <span className="text-sm font-medium text-white/80 flex-1 truncate">{targetName}</span>
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
              placeholder="輸入訊息..."
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

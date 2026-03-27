'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Send, Loader2, X } from 'lucide-react'

interface Conversation {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

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

export default function MessagesPage() {
  const router = useRouter()
  const [meId, setMeId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => {
        if (!d?.userId) { router.push(`/login?redirect=/messages`); return }
        setMeId(d.userId)
      }).catch(() => {})
  }, [router])

  useEffect(() => {
    if (!meId) return
    fetch('/api/admin/social/messages')
      .then(r => r.ok ? r.json() as Promise<{ conversations: Conversation[] }> : null)
      .then(d => { if (d?.conversations) setConversations(d.conversations) })
      .finally(() => setLoading(false))
  }, [meId])

  useEffect(() => {
    if (!active || !meId) return
    setMsgLoading(true)
    setMessages([])

    // Close previous SSE
    esRef.current?.close()

    fetch(`/api/admin/social/messages/${active.userId}`)
      .then(r => r.ok ? r.json() as Promise<{ messages: Message[] }> : null)
      .then(d => { if (d?.messages) setMessages(d.messages) })
      .catch(() => {})
      .finally(() => setMsgLoading(false))

    const es = new EventSource(`/api/admin/social/messages/sse?userId=${active.userId}`)
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
                id: m.id, content: m.content, createdAt: m.createdAt,
                isMine: m.fromUserId === meId, fromName: m.fromName, fromAvatar: m.fromAvatar,
              }))
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
          })
        }
      } catch { /* ignore */ }
    }

    return () => { es.close(); esRef.current = null }
  }, [active, meId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending || !active) return
    const text = input.trim()
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: active.userId, content: text }),
      })
      if (res.ok) {
        const data = await res.json() as { message: { id: string; createdAt: string } }
        setMessages(prev => [...prev, {
          id: data.message.id, content: text,
          createdAt: data.message.createdAt, isMine: true,
          fromName: null, fromAvatar: null,
        }])
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  const initials = (name: string | null) => (name ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {active ? (
            <button onClick={() => setActive(null)} className="flex items-center gap-2 text-sm text-white/50 hover:text-white md:hidden">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="font-semibold">{active ? (active.displayName ?? '私訊') : '訊息'}</h1>
        </div>
      </nav>

      <div className="flex-1 flex max-w-2xl mx-auto w-full">
        {/* Conversation list — hidden on mobile when chat open */}
        <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 md:border-r md:border-white/8 shrink-0`}>
          {loading ? (
            <div className="flex justify-center pt-16">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 text-white/25">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">還沒有訊息</p>
              <p className="text-xs mt-1">前往別人的個人頁面發起對話</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map(c => (
                <button
                  key={c.userId}
                  onClick={() => setActive(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.04] transition-colors ${active?.userId === c.userId ? 'bg-white/[0.06]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/70 overflow-hidden shrink-0">
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(c.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/85 truncate">{c.displayName ?? '用戶'}</span>
                      <span className="text-[10px] text-white/30 shrink-0 ml-2">{formatTime(c.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{c.lastMessagePreview}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {active ? (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center pt-10">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-white/25 pt-10">開始對話吧 👋</p>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    msg.isMine ? 'bg-amber-500/25 text-amber-100 rounded-br-sm' : 'bg-white/8 text-white/80 rounded-bl-sm'
                  }`}>
                    <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.isMine ? 'text-amber-300/50 text-right' : 'text-white/25'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/8 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="輸入訊息..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="p-2.5 bg-amber-500/25 border border-amber-400/30 rounded-xl text-amber-300 hover:bg-amber-500/35 transition-colors disabled:opacity-40"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-white/20">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">選擇一個對話</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

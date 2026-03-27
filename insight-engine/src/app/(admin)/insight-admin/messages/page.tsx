'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, ArrowLeft, MessageCircle, Search } from 'lucide-react'

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

interface SSEData {
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

interface AuthMe {
  userId: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showThread, setShowThread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<AuthMe> : null)
      .then(d => { if (d?.userId) setMeId(d.userId) })
      .catch(() => {})
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social/messages')
      const data = await res.json() as { conversations: Conversation[] }
      setConversations(data.conversations ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  const loadMessages = useCallback(async (userId: string) => {
    setLoadingMsgs(true)
    setMessages([])
    try {
      const res = await fetch(`/api/admin/social/messages/${userId}`)
      const data = await res.json() as { messages: Message[] }
      setMessages(data.messages ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    if (!selected || !meId) return
    loadMessages(selected.userId)

    esRef.current?.close()
    const url = `/api/admin/social/messages/sse?userId=${selected.userId}`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as SSEData
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
      } catch {
        // ignore parse errors
      }
    }

    return () => {
      es.close()
      esRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.userId, meId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelect = (conv: Conversation) => {
    setSelected(conv)
    setShowThread(true)
  }

  const send = async () => {
    if (!input.trim() || sending || !selected) return
    const text = input.trim()
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selected.userId, content: text }),
      })
      if (res.ok) {
        const data = await res.json() as { message: { id: string; createdAt: string } }
        setMessages(prev => [...prev, {
          id: data.message.id,
          content: text,
          createdAt: data.message.createdAt,
          isMine: true,
          fromName: null,
          fromAvatar: null,
        }])
        setConversations(prev => prev.map(c =>
          c.userId === selected.userId
            ? { ...c, lastMessagePreview: text, lastMessageAt: data.message.createdAt, unreadCount: 0 }
            : c
        ))
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredConvs = conversations.filter(c =>
    !search || (c.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name: string | null) => (name ?? '?').slice(0, 2).toUpperCase()

  const GlassPanel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-px rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-purple-500/10 ${className}`}>
      <div className="h-full rounded-[calc(1rem-1px)] bg-slate-900/80 backdrop-blur-xl overflow-hidden">
        {children}
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        {showThread && (
          <button
            onClick={() => setShowThread(false)}
            className="md:hidden p-2 text-white/50 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white/90">私訊</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* Conversation list */}
        <GlassPanel className={`flex flex-col min-h-0 ${showThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋對話..."
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/30">還沒有對話</p>
              </div>
            ) : filteredConvs.map(conv => (
              <button
                key={conv.userId}
                onClick={() => handleSelect(conv)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors text-left ${selected?.userId === conv.userId ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 shrink-0 overflow-hidden">
                  {conv.avatarUrl
                    ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials(conv.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/80 truncate">{conv.displayName ?? '用戶'}</span>
                    <span className="text-[10px] text-white/25 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40 truncate">{conv.lastMessagePreview}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 shrink-0 w-4 h-4 bg-amber-500 rounded-full text-[10px] text-slate-900 font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Thread panel */}
        <GlassPanel className={`flex flex-col min-h-0 ${!showThread && !selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/40 text-sm">選擇一個對話開始聊天</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
                  {selected.avatarUrl
                    ? <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials(selected.displayName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/85">{selected.displayName ?? '用戶'}</p>
                  <p className="text-[10px] text-emerald-400/60">● 即時訊息</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-white/25 pt-8">開始對話吧 👋</p>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!msg.isMine && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-white/60 shrink-0 overflow-hidden">
                        {selected.avatarUrl
                          ? <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : initials(selected.displayName)}
                      </div>
                    )}
                    <div className={`max-w-[70%]`}>
                      <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        msg.isMine
                          ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-100 rounded-br-sm border border-amber-400/20'
                          : 'bg-white/8 text-white/80 rounded-bl-sm border border-white/8'
                      }`}>
                        <p className="break-words">{msg.content}</p>
                      </div>
                      <p className={`text-[10px] mt-0.5 text-white/25 ${msg.isMine ? 'text-right' : ''}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-white/8">
                <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-amber-400/30 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                    placeholder="輸入訊息... (Enter 送出，Shift+Enter 換行)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none resize-none max-h-24 overflow-y-auto"
                    style={{ minHeight: '24px' }}
                  />
                  <button
                    onClick={() => void send()}
                    disabled={!input.trim() || sending}
                    className="shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-slate-900 disabled:opacity-40 hover:from-amber-400 hover:to-orange-400 transition-all shadow-md disabled:shadow-none"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}

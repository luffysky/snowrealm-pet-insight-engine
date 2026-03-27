'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Loader2, ArrowLeft, MessageCircle, Search, MoreHorizontal,
  RotateCcw, Trash2, Bookmark, BookmarkCheck, Download, CheckSquare,
  Square, Trash, UserPlus, Bell, Check, X, Users,
} from 'lucide-react'

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
  recalledAt: string | null
  isSaved: boolean
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

interface AuthMe { userId: string }

interface FriendRequest {
  id: string
  from_user_id: string
  from_name: string | null
  from_avatar: string | null
  message: string | null
  created_at: string
}

interface AdminUser {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: string
}

const GlassPanel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-px rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-purple-500/10 ${className}`}>
    <div className="h-full rounded-[calc(1rem-1px)] bg-slate-900/80 backdrop-blur-xl overflow-hidden">
      {children}
    </div>
  </div>
)

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
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats')

  // Message actions
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set())

  // Friends
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [addingUserId, setAddingUserId] = useState<string | null>(null)

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
    } catch { /* ignore */ }
    finally { setLoadingConvs(false) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  const loadFriendRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social/friends?type=incoming')
      const data = await res.json() as { requests: FriendRequest[] }
      setFriendRequests(data.requests ?? [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadFriendRequests() }, [loadFriendRequests])

  const loadMessages = useCallback(async (userId: string) => {
    setLoadingMsgs(true)
    setMessages([])
    try {
      const res = await fetch(`/api/admin/social/messages/${userId}`)
      const data = await res.json() as { messages: Message[] }
      setMessages(data.messages ?? [])
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false) }
  }, [])

  useEffect(() => {
    if (!selected || !meId) return
    loadMessages(selected.userId)
    esRef.current?.close()
    const es = new EventSource(`/api/admin/social/messages/sse?userId=${selected.userId}`)
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
                recalledAt: null,
                isSaved: false,
              }))
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
          })
        }
      } catch { /* ignore */ }
    }
    return () => { es.close(); esRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.userId, meId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close menu when clicking outside
  useEffect(() => {
    const handler = () => setMenuMsgId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleSelect = (conv: Conversation) => {
    setSelected(conv)
    setShowThread(true)
    setSelectMode(false)
    setSelectedMsgIds(new Set())
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
          recalledAt: null,
          isSaved: false,
        }])
        setConversations(prev => prev.map(c =>
          c.userId === selected.userId
            ? { ...c, lastMessagePreview: text, lastMessageAt: data.message.createdAt, unreadCount: 0 }
            : c
        ))
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  // ── Message actions ──────────────────────────────────────────

  const recallMessage = async (msgId: string) => {
    if (!selected) return
    const res = await fetch(`/api/admin/social/messages/${selected.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recall', messageId: msgId }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: '[已收回]', recalledAt: new Date().toISOString() } : m
      ))
    }
    setMenuMsgId(null)
  }

  const deleteMessage = async (msgId: string) => {
    if (!selected) return
    await fetch(`/api/admin/social/messages/${selected.userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    })
    setMessages(prev => prev.filter(m => m.id !== msgId))
    setMenuMsgId(null)
  }

  const bulkDelete = async () => {
    if (!selected || selectedMsgIds.size === 0) return
    await fetch(`/api/admin/social/messages/${selected.userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds: Array.from(selectedMsgIds) }),
    })
    setMessages(prev => prev.filter(m => !selectedMsgIds.has(m.id)))
    setSelectedMsgIds(new Set())
    setSelectMode(false)
  }

  const toggleSave = async (msg: Message) => {
    if (!selected) return
    const action = msg.isSaved ? 'unsave' : 'save'
    const res = await fetch(`/api/admin/social/messages/${selected.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, messageId: msg.id }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, isSaved: !m.isSaved } : m
      ))
    }
    setMenuMsgId(null)
  }

  const exportMessages = () => {
    if (!selected) return
    window.open(`/api/admin/social/messages/${selected.userId}?export=1`, '_blank')
  }

  // ── Friend requests ──────────────────────────────────────────

  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/admin/social/friends?type=users')
      const data = await res.json() as { users: AdminUser[] }
      setAllUsers(data.users ?? [])
    } catch { /* ignore */ }
  }

  const sendFriendRequest = async (toUserId: string) => {
    setAddingUserId(toUserId)
    try {
      await fetch('/api/admin/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId }),
      })
    } finally {
      setAddingUserId(null)
    }
  }

  const respondFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const res = await fetch('/api/admin/social/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    if (res.ok) {
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
      if (action === 'accept') loadConversations()
    }
  }

  // ── Helpers ──────────────────────────────────────────────────

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

  const toggleSelectMsg = (id: string) => {
    setSelectedMsgIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isRecalled = (msg: Message) => !!msg.recalledAt || msg.content === '[已收回]'

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        {showThread && (
          <button onClick={() => setShowThread(false)} className="md:hidden p-2 text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white/90">私訊</h1>
        {friendRequests.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-400/30 rounded-full text-xs text-amber-300">
            <Bell className="w-3 h-3" />
            {friendRequests.length} 筆好友請求
          </span>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* Left panel */}
        <GlassPanel className={`flex flex-col min-h-0 ${showThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {(['chats', 'friends'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab ? 'text-amber-300 border-b-2 border-amber-400' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab === 'chats' ? <><MessageCircle className="w-3.5 h-3.5" />對話</> : <><Users className="w-3.5 h-3.5" />好友</>}
              </button>
            ))}
          </div>

          {activeTab === 'chats' ? (
            <>
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
              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
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
                      {conv.avatarUrl ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(conv.displayName)}
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
            </>
          ) : (
            /* Friends tab */
            <div className="flex-1 overflow-y-auto">
              {/* Incoming requests */}
              {friendRequests.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs text-white/40 font-medium mb-2">待接受的請求</p>
                  {friendRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/70 shrink-0 overflow-hidden">
                        {req.from_avatar ? <img src={req.from_avatar} alt="" className="w-full h-full object-cover" /> : initials(req.from_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 truncate">{req.from_name ?? '用戶'}</p>
                        {req.message && <p className="text-[10px] text-white/40 truncate">{req.message}</p>}
                      </div>
                      <button onClick={() => respondFriendRequest(req.id, 'accept')}
                        className="w-6 h-6 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/30 rounded-lg flex items-center justify-center transition-colors">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button onClick={() => respondFriendRequest(req.id, 'decline')}
                        className="w-6 h-6 bg-red-500/10 hover:bg-red-500/30 border border-red-400/20 rounded-lg flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add friend button */}
              <div className="px-3 py-2">
                <button
                  onClick={() => { setShowAddFriend(s => !s); if (!showAddFriend) loadAllUsers() }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 rounded-xl text-sm text-amber-300 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  加好友
                </button>
              </div>

              {showAddFriend && (
                <div className="px-3 pb-3">
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="搜尋用戶..."
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none mb-2"
                  />
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allUsers
                      .filter(u => u.id !== meId && (!userSearch || (u.display_name ?? '').toLowerCase().includes(userSearch.toLowerCase())))
                      .map(u => (
                        <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-white/60 shrink-0 overflow-hidden">
                            {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(u.display_name)}
                          </div>
                          <span className="flex-1 text-xs text-white/70 truncate">{u.display_name ?? '用戶'}</span>
                          <button
                            onClick={() => sendFriendRequest(u.id)}
                            disabled={addingUserId === u.id}
                            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/20 rounded-lg text-[10px] text-amber-300 transition-colors disabled:opacity-50"
                          >
                            {addingUserId === u.id ? '...' : '邀請'}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white/80 overflow-hidden shrink-0">
                  {selected.avatarUrl ? <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(selected.displayName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/85">{selected.displayName ?? '用戶'}</p>
                  <p className="text-[10px] text-emerald-400/60">● 即時訊息</p>
                </div>
                {/* Toolbar */}
                <div className="flex items-center gap-1">
                  {selectMode ? (
                    <>
                      <span className="text-xs text-white/40">{selectedMsgIds.size} 已選</span>
                      <button
                        onClick={bulkDelete}
                        disabled={selectedMsgIds.size === 0}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-400/20 rounded-lg text-xs text-red-400 disabled:opacity-40 transition-colors"
                      >
                        <Trash className="w-3 h-3" />批量刪除
                      </button>
                      <button
                        onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()) }}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/50 transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectMode(true)}
                        title="選取模式"
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={exportMessages}
                        title="匯出對話"
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-white/25 pt-8">開始對話吧 👋</p>
                ) : messages.map(msg => {
                  const recalled = isRecalled(msg)
                  const isSelected = selectedMsgIds.has(msg.id)

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} gap-2 group relative ${isSelected ? 'bg-amber-500/5 rounded-xl px-1' : ''}`}
                      onMouseEnter={() => !selectMode && setHoveredMsgId(msg.id)}
                      onMouseLeave={() => { if (menuMsgId !== msg.id) setHoveredMsgId(null) }}
                    >
                      {/* Select checkbox */}
                      {selectMode && (
                        <button
                          onClick={() => toggleSelectMsg(msg.id)}
                          className="self-center shrink-0 text-white/40"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      )}

                      {!msg.isMine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-white/60 shrink-0 overflow-hidden self-end">
                          {selected.avatarUrl ? <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(selected.displayName)}
                        </div>
                      )}

                      <div className={`max-w-[65%] sm:max-w-[70%]`}>
                        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          recalled
                            ? 'bg-white/5 text-white/30 italic border border-white/5'
                            : msg.isMine
                              ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-100 rounded-br-sm border border-amber-400/20'
                              : 'bg-white/8 text-white/80 rounded-bl-sm border border-white/8'
                        }`}>
                          <p className="break-words">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-0.5 ${msg.isMine ? 'justify-end' : ''}`}>
                          <p className="text-[10px] text-white/25">{formatTime(msg.createdAt)}</p>
                          {msg.isSaved && <Bookmark className="w-2.5 h-2.5 text-amber-400/60" />}
                        </div>
                      </div>

                      {/* Hover action menu (not in select mode, not recalled) */}
                      {!selectMode && !recalled && (hoveredMsgId === msg.id || menuMsgId === msg.id) && (
                        <div className={`self-center relative ${msg.isMine ? 'order-first' : ''}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuMsgId(menuMsgId === msg.id ? null : msg.id) }}
                            className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuMsgId === msg.id && (
                            <div
                              className={`absolute bottom-full mb-1 z-50 w-36 bg-slate-800/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-xl overflow-hidden ${msg.isMine ? 'right-0' : 'left-0'}`}
                              onClick={e => e.stopPropagation()}
                            >
                              {msg.isMine && (
                                <button
                                  onClick={() => recallMessage(msg.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />收回訊息
                                </button>
                              )}
                              <button
                                onClick={() => toggleSave(msg)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                              >
                                {msg.isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                                {msg.isSaved ? '取消保存' : '保存訊息'}
                              </button>
                              <div className="border-t border-white/8" />
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />刪除訊息
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
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

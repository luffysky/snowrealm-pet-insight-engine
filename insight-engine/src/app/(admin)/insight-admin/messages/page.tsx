'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Loader2, ArrowLeft, MessageCircle, Search, MoreHorizontal,
  RotateCcw, Trash2, Bookmark, BookmarkCheck, Download, CheckSquare,
  Square, Trash, UserPlus, Bell, Check, X, Users, Smile, Paperclip,
  Phone, Video, Info, ChevronDown, Mic, MicOff, Music, Palette,
} from 'lucide-react'
import { BgPicker, ChatBgLayer, type BgId, CHAT_BACKGROUNDS } from '@/components/admin/chat-bg'

interface Conversation {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

const AUDIO_PREFIX = '[AUDIO]:'
const STICKER_PREFIX = '[STICKER]:'

interface StickerPack {
  id: string
  name: string
  coverUrl: string | null
  sortOrder: number
  stickers: { id: string; url: string }[]
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

// ── Avatar ──
function Avatar({ name, url, size = 'md', online }: { name: string | null; url?: string | null; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  const dot = size === 'sm' ? 'w-2 h-2 border' : 'w-2.5 h-2.5 border-2'
  const initials = (name ?? '?').slice(0, 2).toUpperCase()
  return (
    <div className={`relative shrink-0 ${dim}`}>
      <div className={`${dim} rounded-full bg-gradient-to-br from-amber-500/40 to-purple-600/40 flex items-center justify-center font-bold text-[#3d3155]/90 overflow-hidden ring-1 ring-white/10`}>
        {url ? <img src={url} alt={name ?? ''} className="w-full h-full object-cover" /> : initials}
      </div>
      {online && (
        <span className={`absolute bottom-0 right-0 ${dot} bg-emerald-400 rounded-full border-slate-900`} />
      )}
    </div>
  )
}

// ── Date separator ──
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[10px] text-[#6b5fa8] px-2 py-0.5 bg-white/5 rounded-full">{date}</span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats')

  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set())

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [addingUserId, setAddingUserId] = useState<string | null>(null)

  const [recording, setRecording] = useState(false)
  const [recordingSecs, setRecordingSecs] = useState(0)
  const [audioUploading, setAudioUploading] = useState(false)

  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([])
  const [stickerPackIdx, setStickerPackIdx] = useState(0)
  const [loadingStickers, setLoadingStickers] = useState(false)

  // ── Chat background ──
  const BG_KEY = 'insight_chat_bg'
  const BG_CUSTOM_KEY = 'insight_chat_bg_custom'
  const BG_OWNED_KEY = 'insight_chat_bg_owned'
  const [chatBgId, setChatBgId] = useState<BgId>('default')
  const [chatCustomUrl, setChatCustomUrl] = useState<string | undefined>()
  const [bgOwned, setBgOwned] = useState<Set<BgId>>(new Set())
  const [zcoinBalance, setZcoinBalance] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioFileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Load chat background from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(BG_KEY) as BgId | null
    if (saved) setChatBgId(saved)
    const savedCustom = localStorage.getItem(BG_CUSTOM_KEY)
    if (savedCustom) setChatCustomUrl(savedCustom)
    const savedOwned = localStorage.getItem(BG_OWNED_KEY)
    if (savedOwned) {
      try { setBgOwned(new Set(JSON.parse(savedOwned) as BgId[])) } catch { /* ignore */ }
    }
    // Fetch Z幣 balance
    fetch('/api/zcoin')
      .then(r => r.ok ? r.json() as Promise<{ balance: { balance: number } }> : null)
      .then(d => { if (d?.balance?.balance != null) setZcoinBalance(d.balance.balance) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // ── Background handlers ──
  const handleBgSelect = (id: BgId) => {
    setChatBgId(id)
    localStorage.setItem(BG_KEY, id)
  }

  const handleBgUpload = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    if (!res.ok) throw new Error('上傳失敗')
    const data = await res.json() as { url: string }
    setChatBgId('custom')
    setChatCustomUrl(data.url)
    localStorage.setItem(BG_KEY, 'custom')
    localStorage.setItem(BG_CUSTOM_KEY, data.url)
  }

  const handleBgPurchase = async (def: { id: BgId; price: number; name: string }) => {
    const res = await fetch('/api/zcoin/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: def.price, reason: 'decoration', referenceId: `bg_${def.id}` }),
    })
    const data = await res.json() as { ok?: boolean; error?: string; newBalance?: number }
    if (!res.ok || !data.ok) throw new Error(data.error ?? '購買失敗')
    const next = new Set(bgOwned)
    next.add(def.id)
    setBgOwned(next)
    setZcoinBalance(data.newBalance ?? zcoinBalance - def.price)
    localStorage.setItem(BG_OWNED_KEY, JSON.stringify([...next]))
    handleBgSelect(def.id)
  }

  const send = async () => {
    if (!input.trim() || sending || !selected) return
    const text = input.trim()
    setSending(true)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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

  const sendAudioMessage = async (blob: Blob) => {
    if (!selected) return
    setAudioUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', blob, 'voice.webm')
      const res = await fetch('/api/upload/audio', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!data.url) throw new Error(data.error ?? '上傳失敗')

      const audioContent = `${AUDIO_PREFIX}${data.url}`
      const msgRes = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selected.userId, content: audioContent }),
      })
      if (msgRes.ok) {
        const msgData = await msgRes.json() as { message: { id: string; createdAt: string } }
        setMessages(prev => [...prev, {
          id: msgData.message.id,
          content: audioContent,
          createdAt: msgData.message.createdAt,
          isMine: true,
          fromName: null,
          fromAvatar: null,
          recalledAt: null,
          isSaved: false,
        }])
        setConversations(prev => prev.map(c =>
          c.userId === selected.userId
            ? { ...c, lastMessagePreview: '🎵 語音訊息', lastMessageAt: msgData.message.createdAt }
            : c
        ))
      }
    } catch (err) {
      console.error('[sendAudioMessage]', err)
    } finally {
      setAudioUploading(false)
    }
  }

  const handleAudioFile = async (files: FileList | null) => {
    if (!files?.[0]) return
    await sendAudioMessage(files[0])
  }

  const startRecording = async () => {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' })
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType })
          await sendAudioMessage(blob)
        }
        audioChunksRef.current = []
      }
      mr.start(100)
      mediaRecorderRef.current = mr
      setRecording(true)
      setRecordingSecs(0)
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000)
    } catch (err) {
      console.error('[startRecording] mic access denied', err)
    }
  }

  const stopRecording = () => {
    if (!recording) return
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
    setRecordingSecs(0)
  }

  const cancelRecording = () => {
    if (!recording) return
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setRecording(false)
    setRecordingSecs(0)
  }

  const formatRecordingSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const loadStickerPacks = async () => {
    if (stickerPacks.length > 0) return
    setLoadingStickers(true)
    try {
      const res = await fetch('/api/stickers')
      const data = await res.json() as { packs: StickerPack[] }
      setStickerPacks(data.packs ?? [])
    } catch { /* ignore */ }
    finally { setLoadingStickers(false) }
  }

  const sendSticker = async (url: string) => {
    if (!selected) return
    setShowStickerPicker(false)
    const content = `${STICKER_PREFIX}${url}`
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selected.userId, content }),
      })
      if (res.ok) {
        const data = await res.json() as { message: { id: string; createdAt: string } }
        setMessages(prev => [...prev, {
          id: data.message.id,
          content,
          createdAt: data.message.createdAt,
          isMine: true,
          fromName: null,
          fromAvatar: null,
          recalledAt: null,
          isSaved: false,
        }])
        setConversations(prev => prev.map(c =>
          c.userId === selected.userId
            ? { ...c, lastMessagePreview: '🎭 貼圖', lastMessageAt: data.message.createdAt }
            : c
        ))
      }
    } catch { /* ignore */ }
  }

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

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === now.toDateString()) return '今天'
    if (d.toDateString() === yesterday.toDateString()) return '昨天'
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const filteredConvs = conversations.filter(c =>
    !search || (c.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const isRecalled = (msg: Message) => !!msg.recalledAt || msg.content === '[已收回]'
  const toggleSelectMsg = (id: string) => setSelectedMsgIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  // Group messages by date for separators
  const messagesWithDates = messages.reduce<{ type: 'date' | 'msg'; date?: string; msg?: Message }[]>((acc, msg, i) => {
    const prev = messages[i - 1]
    const curDate = formatDateLabel(msg.createdAt)
    const prevDate = prev ? formatDateLabel(prev.createdAt) : null
    if (curDate !== prevDate) acc.push({ type: 'date', date: curDate })
    acc.push({ type: 'msg', msg })
    return acc
  }, [])

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header */}
      <div className="mb-4 flex items-center gap-3">
        {showThread && (
          <button onClick={() => setShowThread(false)} className="md:hidden p-2 text-[#6b5fa8] hover:text-[#3d3155] rounded-xl hover:bg-[#b8a9e8]/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-[#3d3155]">私訊</h1>
        {friendRequests.length > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-400/25 rounded-full text-xs text-amber-700 font-medium">
            <Bell className="w-3 h-3" />
            {friendRequests.length} 筆好友請求
          </span>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-3 min-h-0">

        {/* ── Left: Conversation list ── */}
        <div className={`flex flex-col min-h-0 rounded-[20px] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-xl ${showThread ? 'hidden md:flex' : 'flex'}`}>

          {/* Tabs */}
          <div className="flex px-2 pt-2 gap-1 shrink-0">
            {(['chats', 'friends'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-amber-500/20 text-amber-700 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'text-[#8a7ca8] hover:text-[#8a7ca8] hover:bg-[#b8a9e8]/10'
                }`}
              >
                {tab === 'chats'
                  ? <><MessageCircle className="w-3.5 h-3.5" />對話</>
                  : <><Users className="w-3.5 h-3.5" />好友</>
                }
              </button>
            ))}
          </div>

          {activeTab === 'chats' ? (
            <>
              {/* Search */}
              <div className="px-3 pt-2 pb-1 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b5fa8]" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="搜尋聯絡人..."
                    className="w-full pl-8 pr-3 py-2 bg-white/60 border border-[#b8a9e8]/25 rounded-xl text-xs text-[#3d3155] placeholder-[#b5a8d0] outline-none focus:border-amber-400/30 focus:bg-white/70 transition-all"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                {loadingConvs ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#6b5fa8] animate-spin" /></div>
                ) : filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-center">
                    <div className="w-12 h-12 rounded-[20px] bg-white/5 flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-[#6b5fa8]" />
                    </div>
                    <p className="text-xs text-[#6b5fa8]">還沒有對話</p>
                  </div>
                ) : filteredConvs.map(conv => {
                  const isActive = selected?.userId === conv.userId
                  return (
                    <button key={conv.userId} onClick={() => handleSelect(conv)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                        isActive
                          ? 'bg-amber-500/15 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]'
                          : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <Avatar name={conv.displayName} url={conv.avatarUrl} online={isActive} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium truncate ${isActive ? 'text-amber-700' : 'text-[#3d3155]'}`}>
                            {conv.displayName ?? '用戶'}
                          </span>
                          <span className="text-[10px] text-[#6b5fa8] shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-[#8a7ca8] truncate">{conv.lastMessagePreview || '...'}</p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 shrink-0 min-w-[18px] h-[18px] bg-gradient-to-r from-amber-500 to-orange-400 rounded-full text-[10px] text-slate-900 font-bold flex items-center justify-center px-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            /* ── Friends tab ── */
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {/* Incoming requests */}
              {friendRequests.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#8a7ca8] font-semibold uppercase tracking-wider mb-1.5 px-1">待接受的請求</p>
                  {friendRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-2.5 p-2.5 bg-amber-500/5 border border-amber-400/10 rounded-xl mb-1.5">
                      <Avatar name={req.from_name} url={req.from_avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#3d3155] truncate">{req.from_name ?? '用戶'}</p>
                        {req.message && <p className="text-[10px] text-[#8a7ca8] truncate">{req.message}</p>}
                      </div>
                      <button onClick={() => respondFriendRequest(req.id, 'accept')}
                        className="w-7 h-7 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/25 rounded-lg flex items-center justify-center transition-colors">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button onClick={() => respondFriendRequest(req.id, 'decline')}
                        className="w-7 h-7 bg-red-500/10 hover:bg-red-500/25 border border-red-400/15 rounded-lg flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add friend */}
              <button
                onClick={() => { setShowAddFriend(s => !s); if (!showAddFriend) loadAllUsers() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-400/15 rounded-xl text-sm text-amber-700 transition-all font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>尋找並加好友</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showAddFriend ? 'rotate-180' : ''}`} />
              </button>

              {showAddFriend && (
                <div className="space-y-1.5">
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="搜尋用戶名稱..."
                    className="w-full px-3 py-2 bg-white/60 border border-[#b8a9e8]/25 rounded-xl text-xs text-[#3d3155] placeholder-[#b5a8d0] outline-none focus:border-amber-400/25"
                  />
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {allUsers
                      .filter(u => u.id !== meId && (!userSearch || (u.display_name ?? '').toLowerCase().includes(userSearch.toLowerCase())))
                      .map(u => (
                        <div key={u.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#b8a9e8]/10 transition-colors">
                          <Avatar name={u.display_name} url={u.avatar_url} size="sm" />
                          <span className="flex-1 text-xs text-[#3d3155] truncate">{u.display_name ?? '用戶'}</span>
                          <button
                            onClick={() => sendFriendRequest(u.id)}
                            disabled={addingUserId === u.id}
                            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/20 rounded-lg text-[10px] text-amber-700 font-medium transition-colors disabled:opacity-50"
                          >
                            {addingUserId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '邀請'}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Thread ── */}
        <div className={`flex flex-col min-h-0 rounded-[20px] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[rgba(15,15,25,0.9)] to-[rgba(10,10,20,0.95)] backdrop-blur-xl ${!showThread && !selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 blur-xl" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/15 to-purple-600/15 border border-white/10 flex items-center justify-center">
                  <MessageCircle className="w-9 h-9 text-[#8a7ca8]" />
                </div>
              </div>
              <p className="text-[#8a7ca8] font-medium mb-1">選擇一個對話</p>
              <p className="text-xs text-[#6b5fa8]">從左側選擇聯絡人開始聊天</p>
            </div>
          ) : (
            <>
              {/* ── Thread header ── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0 bg-white/[0.02]">
                <button onClick={() => setShowThread(false)} className="md:hidden text-[#6b5fa8] hover:text-[#3d3155] p-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar name={selected.displayName} url={selected.avatarUrl} online />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#3d3155]/90 leading-tight">{selected.displayName ?? '用戶'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] text-emerald-400/70 font-medium">即時連線</p>
                  </div>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-1">
                  {selectMode ? (
                    <>
                      <span className="text-xs text-[#8a7ca8] mr-1">{selectedMsgIds.size} 已選</span>
                      <button onClick={bulkDelete} disabled={selectedMsgIds.size === 0}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/30 border border-red-400/20 rounded-xl text-xs text-red-400 disabled:opacity-40 transition-colors font-medium"
                      >
                        <Trash className="w-3 h-3" />刪除
                      </button>
                      <button onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()) }}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-[#b8a9e8]/12 border border-white/10 rounded-xl text-xs text-[#6b5fa8] transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setSelectMode(true)} title="選取模式"
                        className="p-2 rounded-xl text-[#6b5fa8] hover:text-[#8a7ca8] hover:bg-white/6 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button onClick={exportMessages} title="匯出對話"
                        className="p-2 rounded-xl text-[#6b5fa8] hover:text-[#8a7ca8] hover:bg-white/6 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <BgPicker
                        current={chatBgId}
                        customUrl={chatCustomUrl}
                        owned={bgOwned}
                        zcoinBalance={zcoinBalance}
                        onSelect={handleBgSelect}
                        onUpload={handleBgUpload}
                        onPurchase={handleBgPurchase}
                      />
                      <button className="p-2 rounded-xl text-[#6b5fa8] hover:text-[#8a7ca8] hover:bg-white/6 transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
                {/* Dynamic background */}
                <ChatBgLayer bgId={chatBgId} customUrl={chatCustomUrl} />
                <div className="relative z-10 px-4 py-3 space-y-1">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-10"><Loader2 className="w-5 h-5 text-[#6b5fa8] animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="text-3xl mb-3">👋</div>
                    <p className="text-sm text-[#6b5fa8]">打個招呼開始聊天吧！</p>
                  </div>
                ) : messagesWithDates.map((item, i) => {
                  if (item.type === 'date') return <DateSeparator key={`date-${i}`} date={item.date!} />

                  const msg = item.msg!
                  const recalled = isRecalled(msg)
                  const isSelected = selectedMsgIds.has(msg.id)
                  const isMine = msg.isMine
                  const isAudio = !recalled && msg.content.startsWith(AUDIO_PREFIX)
                  const audioUrl = isAudio ? msg.content.slice(AUDIO_PREFIX.length) : null
                  const isSticker = !recalled && msg.content.startsWith(STICKER_PREFIX)
                  const stickerUrl = isSticker ? msg.content.slice(STICKER_PREFIX.length) : null
                  // 相容 public 私訊頁發出的媒體格式
                  const isPublicAudio = !recalled && !isAudio && msg.content.startsWith('[audio:') && msg.content.endsWith(']')
                  const publicAudioUrl = isPublicAudio ? msg.content.slice(7, -1) : null
                  const isPublicVideo = !recalled && msg.content.startsWith('[video:') && msg.content.endsWith(']')
                  const publicVideoUrl = isPublicVideo ? msg.content.slice(7, -1) : null
                  const isImage = !recalled && msg.content.startsWith('[img:') && msg.content.endsWith(']')
                  const imageUrl = isImage ? msg.content.slice(5, -1) : null
                  const isGif = !recalled && msg.content.startsWith('[gif:') && msg.content.endsWith(']')
                  const gifUrl = isGif ? msg.content.slice(5, -1) : null
                  const isFileMsg = !recalled && msg.content.startsWith('[file:') && msg.content.endsWith(']')
                  const fileParts = isFileMsg ? msg.content.slice(6, -1).split('|') : null

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 group relative transition-colors ${
                        isMine ? 'justify-end' : 'justify-start'
                      } ${isSelected ? 'bg-amber-500/5 rounded-[20px] px-2 -mx-2' : ''}`}
                      onMouseEnter={() => !selectMode && setHoveredMsgId(msg.id)}
                      onMouseLeave={() => { if (menuMsgId !== msg.id) setHoveredMsgId(null) }}
                    >
                      {/* Select */}
                      {selectMode && (
                        <button onClick={() => toggleSelectMsg(msg.id)} className="self-center text-[#8a7ca8] shrink-0">
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-amber-400" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      )}

                      {!isMine && <Avatar name={selected.displayName} url={selected.avatarUrl} size="sm" />}

                      {/* Hover actions — other side */}
                      {!selectMode && !recalled && (hoveredMsgId === msg.id || menuMsgId === msg.id) && isMine && (
                        <MessageMenu msg={msg} onRecall={recallMessage} onSave={toggleSave} onDelete={deleteMessage}
                          menuOpen={menuMsgId === msg.id} onToggleMenu={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)} align="right" />
                      )}

                      {/* Bubble */}
                      <div className="max-w-[68%] sm:max-w-[72%] space-y-0.5">
                        {isSticker && stickerUrl ? (
                          <div>
                            <img
                              src={stickerUrl}
                              alt="貼圖"
                              className="w-24 h-24 object-contain select-none"
                              draggable={false}
                            />
                          </div>
                        ) : (isAudio && audioUrl) || (isPublicAudio && publicAudioUrl) ? (
                          <div className={`px-3 py-2.5 rounded-[20px] ${
                            isMine ? 'rounded-br-sm bg-gradient-to-br from-amber-500/90 to-orange-400/90 shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                                    : 'rounded-bl-sm bg-white/[0.08] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                          }`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Music className={`w-3.5 h-3.5 shrink-0 ${isMine ? 'text-[#3d3155]' : 'text-amber-700'}`} />
                              <span className={`text-xs font-medium ${isMine ? 'text-[#3d3155]' : 'text-[#6b5fa8]'}`}>語音訊息</span>
                            </div>
                            <audio
                              src={(audioUrl ?? publicAudioUrl)!}
                              controls
                              className="w-48 h-8"
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                        ) : isPublicVideo && publicVideoUrl ? (
                          <div className="rounded-[20px] overflow-hidden max-w-[220px]">
                            <video
                              src={publicVideoUrl}
                              controls
                              className="w-full max-h-48 rounded-[20px]"
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>
                        ) : (isImage && imageUrl) || (isGif && gifUrl) ? (
                          <div className="rounded-[20px] overflow-hidden max-w-[220px]">
                            <img
                              src={(imageUrl ?? gifUrl)!}
                              alt=""
                              className="w-full max-h-60 object-cover rounded-[20px]"
                            />
                          </div>
                        ) : isFileMsg && fileParts ? (
                          <div className={`px-3.5 py-2.5 rounded-[20px] ${
                            isMine
                              ? 'bg-gradient-to-br from-amber-500/90 to-orange-400/90 rounded-br-sm'
                              : 'bg-white/[0.08] border border-white/[0.08] rounded-bl-sm'
                          }`}>
                            <a
                              href={fileParts[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-sm ${isMine ? 'text-white' : 'text-[#3d3155]'}`}
                            >
                              <Paperclip className="w-4 h-4 shrink-0" />
                              <span className="truncate max-w-[160px]">{fileParts[0] || '檔案'}</span>
                            </a>
                          </div>
                        ) : (
                          <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                            recalled
                              ? 'bg-white/4 text-[#6b5fa8] italic border border-white/6 rounded-[20px]'
                              : isMine
                                ? 'bg-gradient-to-br from-amber-500 to-orange-400 text-[#3d3155] font-medium rounded-[20px] rounded-br-sm shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                                : 'bg-white/[0.08] text-[#3d3155] rounded-[20px] rounded-bl-sm border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                          }`}>
                            {msg.content}
                          </div>
                        )}
                        <div className={`flex items-center gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
                          <span className="text-[10px] text-[#6b5fa8]">{formatTime(msg.createdAt)}</span>
                          {msg.isSaved && <Bookmark className="w-2.5 h-2.5 text-amber-700" />}
                        </div>
                      </div>

                      {/* Hover actions — same side */}
                      {!selectMode && !recalled && (hoveredMsgId === msg.id || menuMsgId === msg.id) && !isMine && (
                        <MessageMenu msg={msg} onRecall={recallMessage} onSave={toggleSave} onDelete={deleteMessage}
                          menuOpen={menuMsgId === msg.id} onToggleMenu={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)} align="left" />
                      )}
                    </div>
                  )
                })}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* ── Sticker picker ── */}
              {showStickerPicker && (
                <div className="border-t border-white/8 shrink-0 bg-white/55 backdrop-blur-sm">
                  {/* Pack tabs */}
                  {loadingStickers ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#6b5fa8] animate-spin" /></div>
                  ) : stickerPacks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#6b5fa8]">尚無貼圖包</div>
                  ) : (
                    <>
                      <div className="flex gap-0.5 px-2 pt-2 overflow-x-auto scrollbar-none">
                        {stickerPacks.map((pack, idx) => (
                          <button
                            key={pack.id}
                            onClick={() => setStickerPackIdx(idx)}
                            className={`shrink-0 w-9 h-9 rounded-lg overflow-hidden border transition-all ${
                              stickerPackIdx === idx
                                ? 'border-amber-400/50 ring-1 ring-amber-400/30'
                                : 'border-white/10 hover:border-white/25'
                            }`}
                          >
                            {pack.coverUrl
                              ? <img src={pack.coverUrl} alt={pack.name} className="w-full h-full object-cover" />
                              : <span className="text-lg">🎭</span>
                            }
                          </button>
                        ))}
                      </div>
                      {/* Sticker grid */}
                      <div className="grid grid-cols-6 gap-1 p-2 max-h-44 overflow-y-auto">
                        {(stickerPacks[stickerPackIdx]?.stickers ?? []).map(s => (
                          <button
                            key={s.id}
                            onClick={() => void sendSticker(s.url)}
                            className="aspect-square rounded-xl overflow-hidden hover:bg-[#b8a9e8]/12 transition-colors p-1"
                          >
                            <img src={s.url} alt="" className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Input bar ── */}
              <div className="px-3 py-3 border-t border-white/8 shrink-0 bg-white/[0.02]">
                {/* Recording indicator */}
                {recording && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-400/20 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                    <span className="text-xs text-red-300 font-medium flex-1">錄音中 {formatRecordingSecs(recordingSecs)}</span>
                    <button onClick={cancelRecording} className="text-xs text-[#8a7ca8] hover:text-[#8a7ca8] transition-colors">取消</button>
                    <button
                      onClick={stopRecording}
                      className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/35 border border-red-400/25 rounded-lg text-xs text-red-300 font-medium transition-colors"
                    >
                      {audioUploading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : '完成送出'}
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 bg-white/[0.06] border border-white/10 rounded-[20px] px-1 pl-3 py-1.5 focus-within:border-amber-400/30 focus-within:bg-white/[0.08] transition-all">
                  {/* Left icons */}
                  <div className="flex items-center gap-0.5 self-end pb-1">
                    <button
                      onClick={() => {
                        setShowStickerPicker(v => !v)
                        if (!showStickerPicker) void loadStickerPacks()
                      }}
                      className={`p-1.5 rounded-xl transition-colors ${showStickerPicker ? 'text-amber-400 bg-amber-500/15' : 'text-[#6b5fa8] hover:text-amber-700 hover:bg-[#b8a9e8]/10'}`}
                      title="貼圖"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {/* Audio file upload */}
                    <input
                      ref={audioFileRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={e => void handleAudioFile(e.target.files)}
                    />
                    <button
                      onClick={() => audioFileRef.current?.click()}
                      disabled={audioUploading || recording}
                      className="p-1.5 text-[#6b5fa8] hover:text-amber-700 hover:bg-[#b8a9e8]/10 rounded-xl transition-colors disabled:opacity-40"
                      title="上傳音訊檔案"
                    >
                      {audioUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
                    }}
                    placeholder={recording ? '錄音中...' : '輸入訊息...'}
                    rows={1}
                    disabled={recording}
                    className="flex-1 bg-transparent text-sm text-[#3d3155] placeholder-[#b5a8d0] outline-none resize-none overflow-y-auto py-1 disabled:opacity-40"
                    style={{ minHeight: '22px', maxHeight: '96px' }}
                  />

                  {/* Mic button (hold to record) */}
                  {!input.trim() && !sending && (
                    <button
                      onMouseDown={() => void startRecording()}
                      onMouseUp={stopRecording}
                      onMouseLeave={() => { if (recording) stopRecording() }}
                      onTouchStart={e => { e.preventDefault(); void startRecording() }}
                      onTouchEnd={stopRecording}
                      disabled={audioUploading}
                      className={`shrink-0 self-end mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all select-none ${
                        recording
                          ? 'bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] scale-110 animate-pulse'
                          : 'bg-white/8 text-[#8a7ca8] hover:bg-[#b8a9e8]/15 hover:text-amber-700 active:scale-95'
                      } disabled:opacity-40`}
                      title="按住錄音，放開送出"
                    >
                      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}

                  {(input.trim() || sending) && (
                    <button
                      onClick={() => void send()}
                      disabled={!input.trim() || sending}
                      className={`shrink-0 self-end mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all font-medium ${
                        input.trim()
                          ? 'bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95'
                          : 'bg-white/8 text-[#6b5fa8] cursor-not-allowed'
                      }`}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-center text-[10px] text-[#6b5fa8] mt-1.5">Enter 送出 · Shift+Enter 換行 · 按住麥克風錄音</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Message context menu ──
function MessageMenu({ msg, onRecall, onSave, onDelete, menuOpen, onToggleMenu, align }: {
  msg: Message
  onRecall: (id: string) => void
  onSave: (msg: Message) => void
  onDelete: (id: string) => void
  menuOpen: boolean
  onToggleMenu: () => void
  align: 'left' | 'right'
}) {
  return (
    <div className="self-center relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMenu() }}
        className="p-1.5 rounded-xl text-[#6b5fa8] hover:text-[#8a7ca8] hover:bg-white/8 transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {menuOpen && (
        <div
          className={`absolute bottom-full mb-1.5 z-50 w-38 bg-white/50/98 backdrop-blur-2xl border border-white/12 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={e => e.stopPropagation()}
        >
          {msg.isMine && (
            <button onClick={() => onRecall(msg.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/65 hover:bg-amber-500/10 hover:text-amber-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />收回訊息
            </button>
          )}
          <button onClick={() => onSave(msg)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/65 hover:bg-amber-500/10 hover:text-amber-700 transition-colors"
          >
            {msg.isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
            {msg.isSaved ? '取消保存' : '保存訊息'}
          </button>
          <div className="h-px bg-white/6 mx-2" />
          <button onClick={() => onDelete(msg.id)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />刪除訊息
          </button>
        </div>
      )}
    </div>
  )
}

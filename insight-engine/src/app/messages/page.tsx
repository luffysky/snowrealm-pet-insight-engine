'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Send, Loader2, X, Paperclip, Smile, ImageIcon, Music, File as FileIcon, Gift, Pencil } from 'lucide-react'

// ─── Emoji data ───
const EMOJI_CATEGORIES = [
  { label: '😊', name: '表情', emoji: ['😀','😂','🥹','😍','🥰','😎','🤔','😅','😭','😡','🥺','😴','🤯','🥳','😏','😇','🫡','🤩','😬','🫠','😤','🤗','🫶','👍','👎','❤️','🔥','✨','💯','🎉'] },
  { label: '🐾', name: '動物', emoji: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐙','🦋','🐢','🦄','🐝','🦀','🐠','🦋','🐧','🦅','🦉','🦒','🐘','🦏','🦛','🦓'] },
  { label: '🍔', name: '食物', emoji: ['🍕','🍔','🌮','🍜','🍱','🍣','🍰','🎂','🍩','🍪','🧋','☕','🍺','🥂','🍷','🥤','🍦','🧁','🥗','🥘','🍲','🥞','🍞','🧇','🥐','🥓','🍳','🥚','🧀','🥑'] },
  { label: '🎵', name: '活動', emoji: ['⚽','🏀','🎮','🎸','🎤','🎨','🏊','🚴','🧗','⛷️','🎯','🎳','🎲','🃏','🎭','🎬','📸','🎹','🥁','🎺','🎻','🎪','🏆','🥇','🎁','🎈','🎊','🎋','🎍','🎎'] },
  { label: '🌍', name: '地點', emoji: ['🏠','🏙️','🌄','🌊','⛰️','🗺️','🌴','🌸','🌺','🌻','🌹','🍁','🌿','🌾','🌱','🌲','🌳','☀️','🌙','⭐','🌈','❄️','⚡','🌊','🌋','🏔️','🗻','🏕️','🌅','🌇'] },
  { label: '💼', name: '物品', emoji: ['💎','💍','👑','🎩','🕶️','👜','🧳','📱','💻','⌚','📷','🎒','🔑','🪄','💌','📦','🛍️','🎀','🪞','🪑','🛋️','🪴','🕯️','💡','🔮','📚','🗓️','✏️','📌','🗂️'] },
  // Stickers (big emoji used as stickers)
  { label: '🫶', name: '貼圖', emoji: ['🫶','🤝','🙌','👏','🤜','🤛','✊','🖐️','🤙','🤟','🤘','🖖','👋','🫂','💪','🦾','🧠','👀','👂','🫁','❤️‍🔥','💘','💝','💖','💗','💓','💞','💕','💟','❣️'] },
]

const STICKER_EMOJI = ['🥹','🥰','🤩','🥳','😭','😤','🤯','🫠','🥺','😴','🤗','🤣','😂','😆','😁','😊','🫡','🤔','😬','😏','🤫','😇','😈','👿','💀','🫶','❤️‍🔥','🔥','💯','✨']

// Render message content (text, image, video, audio, file, gif)
function MessageContent({ content, edited }: { content: string; edited?: boolean }) {
  if (content === '[已收回]') {
    return <p className="text-sm text-white/30 italic">已收回訊息</p>
  }
  if (content.startsWith('[img:') && content.endsWith(']')) {
    const url = content.slice(5, -1)
    return <img src={url} alt="" className="max-w-full rounded-xl max-h-60 object-cover" />
  }
  if (content.startsWith('[video:') && content.endsWith(']')) {
    const url = content.slice(7, -1)
    return <video src={url} controls className="max-w-full rounded-xl max-h-48" />
  }
  if (content.startsWith('[audio:') && content.endsWith(']')) {
    const url = content.slice(7, -1)
    return <audio src={url} controls className="w-full max-w-[220px]" />
  }
  if (content.startsWith('[file:') && content.endsWith(']')) {
    const inner = content.slice(6, -1)
    const sep = inner.indexOf('|')
    const name = sep >= 0 ? inner.slice(0, sep) : '檔案'
    const url = sep >= 0 ? inner.slice(sep + 1) : inner
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sky-300 hover:text-sky-200 underline text-sm">
        <FileIcon className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-[160px]">{name}</span>
      </a>
    )
  }
  if (content.startsWith('[gif:') && content.endsWith(']')) {
    const url = content.slice(5, -1)
    return <img src={url} alt="GIF" className="max-w-full rounded-xl max-h-48" />
  }
  // Check if it's a single big sticker emoji
  const isSticker = STICKER_EMOJI.includes(content.trim()) || (content.length <= 4 && /\p{Emoji}/u.test(content))
  if (isSticker && content.trim().length <= 4) {
    return <span className="text-5xl leading-none block">{content}</span>
  }
  return <p className={`text-sm break-words leading-relaxed ${edited ? 'font-semibold' : ''}`}>{content}</p>
}

// --- Draggable floating bubble ---
interface BubbleState {
  content: string
  x: number
  y: number
}

const DRAG_Y_MIN = 0.2   // 20% from top
const DRAG_Y_MAX = 0.8   // 80% from top

function clampPos(x: number, y: number, w: number, h: number) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  return {
    x: Math.max(0, Math.min(vw - w, x)),
    y: Math.max(vh * DRAG_Y_MIN, Math.min(vh * DRAG_Y_MAX - h, y)),
  }
}

function DraggableBubble({ bubble, onClose }: { bubble: BubbleState; onClose: () => void }) {
  const BUBBLE_W = 220
  const BUBBLE_H = 60
  const [pos, setPos] = useState(() => clampPos(bubble.x, bubble.y, BUBBLE_W, BUBBLE_H))
  const dragging = useRef(false)
  const offset = useRef({ dx: 0, dy: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    offset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos(clampPos(e.clientX - offset.current.dx, e.clientY - offset.current.dy, BUBBLE_W, BUBBLE_H))
  }

  const onPointerUp = () => { dragging.current = false }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 200, touchAction: 'none', cursor: 'grab' }}
    >
      <div className="relative max-w-[220px] bg-slate-800/95 backdrop-blur-xl border border-white/15 rounded-2xl px-3.5 py-2.5 shadow-2xl shadow-black/50">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 border border-white/15 rounded-full flex items-center justify-center text-white/50 hover:text-white"
        >
          <X className="w-3 h-3" />
        </button>
        <p className="text-xs text-white/80 break-words leading-relaxed select-none">{bubble.content}</p>
      </div>
    </div>
  )
}

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
  editedAt: string | null
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
  const [bubble, setBubble] = useState<BubbleState | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mediaPanel, setMediaPanel] = useState<'emoji' | 'attach' | 'gif' | null>(null)
  const [emojiCategory, setEmojiCategory] = useState(0)
  const [gifSearch, setGifSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [msgMenu, setMsgMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [editingMsg, setEditingMsg] = useState<{ id: string } | null>(null)
  const [editInput, setEditInput] = useState('')

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
      .then(d => {
        if (d?.messages) {
          setMessages(d.messages)
          // Clear unread count for this conversation in the list
          setConversations(prev => prev.map(c =>
            c.userId === active.userId ? { ...c, unreadCount: 0 } : c
          ))
          // Notify BottomNav / FloatingChat to refresh unread badge
          window.dispatchEvent(new CustomEvent('dm-read'))
        }
      })
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
                editedAt: null,
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
    setInput('')
    await sendContent(text)
  }

  const uploadFile = async (file: File) => {
    if (!active) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/social/messages/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const { url, mediaType, filename } = await res.json() as { url: string; mediaType: string; filename: string }
      let content = ''
      if (mediaType === 'img') content = `[img:${url}]`
      else if (mediaType === 'video') content = `[video:${url}]`
      else if (mediaType === 'audio') content = `[audio:${url}]`
      else content = `[file:${filename}|${url}]`
      await sendContent(content)
    } finally {
      setUploading(false)
    }
  }

  const sendContent = async (content: string) => {
    if (!active) return
    const replyPrefix = replyTo ? `[reply:${replyTo.id}|${replyTo.content.slice(0, 30)}]\n` : ''
    const full = replyPrefix + content
    setSending(true)
    setReplyTo(null)
    try {
      const res = await fetch('/api/admin/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: active.userId, content: full }),
      })
      if (res.ok) {
        const data = await res.json() as { message: { id: string; createdAt: string } }
        setMessages(prev => [...prev, {
          id: data.message.id, content: full,
          createdAt: data.message.createdAt, isMine: true,
          fromName: null, fromAvatar: null, editedAt: null,
        }])
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  const startLongPress = (e: React.PointerEvent, msg: Message) => {
    const { clientX, clientY } = e
    longPressTimer.current = setTimeout(() => {
      setMsgMenu({ msg, x: clientX, y: clientY })
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const deleteMsg = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
    setMsgMenu(null)
    fetch(`/api/admin/social/messages/${active?.userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    }).catch(() => {})
  }

  const recallMsg = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: '[已收回]' } : m))
    setMsgMenu(null)
    fetch(`/api/admin/social/messages/${active?.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recall', messageId: msgId }),
    }).catch(() => {})
  }

  const startEdit = (msg: Message) => {
    const body = msg.content.includes('\n') ? msg.content.split('\n').slice(1).join('\n') : msg.content
    setEditingMsg({ id: msg.id })
    setEditInput(body)
    setMsgMenu(null)
  }

  const saveEdit = async (msgId: string) => {
    const trimmed = editInput.trim()
    if (!trimmed || !active) return
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content: trimmed, editedAt: new Date().toISOString() } : m
    ))
    setEditingMsg(null)
    await fetch(`/api/admin/social/messages/${active.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', messageId: msgId, newContent: trimmed }),
    }).catch(() => {})
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
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <nav className="shrink-0 bg-slate-950/90 backdrop-blur-md border-b border-white/8">
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

      <div className="flex-1 flex max-w-2xl mx-auto w-full overflow-hidden"
        style={{ paddingBottom: 'var(--bnav-h, 5rem)' }}
      >
        {/* Conversation list — hidden on mobile when chat open */}
        <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 md:border-r md:border-white/8 shrink-0 overflow-y-auto`}>
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages — scrollable content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center pt-10">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-white/25 pt-10">開始對話吧 👋</p>
              ) : messages.map(msg => {
                const isRecalled = msg.content === '[已收回]'
                const isEditing = editingMsg?.id === msg.id
                const bodyContent = msg.content.includes('\n') ? msg.content.split('\n').slice(1).join('\n') : msg.content
                const hasReply = msg.content.startsWith('[reply:')
                return (
                <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    onPointerDown={e => !isEditing && startLongPress(e, msg)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerMove={cancelLongPress}
                    style={{ touchAction: 'pan-y' }}
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 select-none cursor-default ${
                      isRecalled ? 'bg-white/[0.04] text-white/30' :
                      msg.isMine ? 'bg-amber-500/25 text-amber-100 rounded-br-sm' : 'bg-white/8 text-white/80 rounded-bl-sm'
                    }`}
                  >
                    {hasReply && !isRecalled && (() => {
                      const lines = msg.content.split('\n')
                      const meta = lines[0].match(/\[reply:[^|]+\|(.+)\]/)
                      return meta ? (
                        <p className="text-[10px] text-white/35 border-l-2 border-white/20 pl-2 mb-1.5 truncate">{meta[1]}</p>
                      ) : null
                    })()}
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editInput}
                          onChange={e => setEditInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id) }
                            if (e.key === 'Escape') setEditingMsg(null)
                          }}
                          autoFocus
                          rows={2}
                          className="w-full bg-transparent text-sm text-amber-100 resize-none outline-none min-w-[160px]"
                        />
                        <div className="flex gap-3 mt-1.5">
                          <button onClick={() => saveEdit(msg.id)} className="text-[11px] text-amber-300 hover:text-amber-100 transition-colors">儲存</button>
                          <button onClick={() => setEditingMsg(null)} className="text-[11px] text-white/40 hover:text-white/60 transition-colors">取消</button>
                        </div>
                      </div>
                    ) : (
                      <MessageContent content={isRecalled ? '[已收回]' : bodyContent} edited={!!msg.editedAt} />
                    )}
                    {!isEditing && (
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${msg.isMine ? 'text-amber-300/50 justify-end' : 'text-white/25'}`}>
                        {msg.editedAt && <span className="opacity-60">已編輯</span>}
                        <span>{formatTime(msg.createdAt)}</span>
                      </p>
                    )}
                  </div>
                </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Media panels */}
            {mediaPanel && (
              <div className="shrink-0 border-t border-white/8 bg-slate-900/80">
                {mediaPanel === 'emoji' && (
                  <div>
                    {/* Category tabs */}
                    <div className="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto">
                      {EMOJI_CATEGORIES.map((cat, i) => (
                        <button key={i} onClick={() => setEmojiCategory(i)}
                          className={`shrink-0 px-2 py-1 rounded-lg text-sm transition-colors ${emojiCategory === i ? 'bg-white/15' : 'text-white/40 hover:text-white/70'}`}
                        >{cat.label}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-8 gap-0.5 px-3 pb-3 max-h-40 overflow-y-auto">
                      {EMOJI_CATEGORIES[emojiCategory].emoji.map(e => (
                        <button key={e} onClick={() => { sendContent(e); setMediaPanel(null) }}
                          className="text-2xl p-1 hover:bg-white/10 rounded-lg transition-colors leading-none"
                        >{e}</button>
                      ))}
                    </div>
                  </div>
                )}

                {mediaPanel === 'attach' && (
                  <div className="flex gap-3 px-4 py-3">
                    {[
                      { icon: <ImageIcon className="w-5 h-5" />, label: '圖片/影片', accept: 'image/*,video/*', color: 'text-sky-400' },
                      { icon: <Music className="w-5 h-5" />, label: '音樂', accept: 'audio/*', color: 'text-purple-400' },
                      { icon: <FileIcon className="w-5 h-5" />, label: '檔案', accept: '.pdf,.zip,.txt,.doc,.docx', color: 'text-amber-400' },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = item.accept
                            fileInputRef.current.click()
                          }
                        }}
                        className="flex flex-col items-center gap-1.5 flex-1"
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="text-[11px] text-white/50">{item.label}</span>
                      </button>
                    ))}
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { uploadFile(f); setMediaPanel(null) } }}
                    />
                  </div>
                )}

                {mediaPanel === 'gif' && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={gifSearch}
                        onChange={e => setGifSearch(e.target.value)}
                        placeholder="貼上 GIF 網址..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-sky-500/40"
                      />
                      <button
                        onClick={() => { if (gifSearch.trim()) { sendContent(`[gif:${gifSearch.trim()}]`); setGifSearch(''); setMediaPanel(null) } }}
                        className="px-3 py-1.5 bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-300 text-xs"
                      >傳送</button>
                    </div>
                    <p className="text-[10px] text-white/25 text-center">貼上 Tenor / GIPHY 的 GIF 圖片網址</p>
                  </div>
                )}
              </div>
            )}

            {/* Reply preview */}
            {replyTo && (
              <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white/5 border-t border-white/8">
                <div className="flex-1 border-l-2 border-amber-400/50 pl-2">
                  <p className="text-[10px] text-amber-300/70">回覆</p>
                  <p className="text-xs text-white/50 truncate">{replyTo.content.slice(0, 50)}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-white/25 hover:text-white/50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input bar */}
            <div className="shrink-0 px-2 py-2 border-t border-white/8">
              <div className="flex items-center gap-1.5">
                <button onClick={() => setMediaPanel(p => p === 'emoji' ? null : 'emoji')}
                  className={`p-2 rounded-xl transition-colors ${mediaPanel === 'emoji' ? 'bg-amber-400/20 text-amber-300' : 'text-white/30 hover:text-white/60'}`}>
                  <Smile className="w-5 h-5" />
                </button>
                <button onClick={() => setMediaPanel(p => p === 'attach' ? null : 'attach')}
                  className={`p-2 rounded-xl transition-colors ${mediaPanel === 'attach' ? 'bg-sky-400/20 text-sky-300' : 'text-white/30 hover:text-white/60'}`}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <button onClick={() => setMediaPanel(p => p === 'gif' ? null : 'gif')}
                  className={`p-2 rounded-xl transition-colors ${mediaPanel === 'gif' ? 'bg-purple-400/20 text-purple-300' : 'text-white/30 hover:text-white/60'}`}>
                  <Gift className="w-5 h-5" />
                </button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  onFocus={() => setMediaPanel(null)}
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

      {/* Message context menu */}
      {msgMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMsgMenu(null)} />
          <div
            className="fixed z-50 bg-slate-800/98 backdrop-blur-xl border border-white/12 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 min-w-[150px]"
            style={{
              left: Math.min(msgMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 170),
              top: Math.min(msgMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 160),
            }}
          >
            <button
              onClick={() => { setReplyTo(msgMenu.msg); setMsgMenu(null) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm text-white/80 text-left transition-colors"
            >
              <span>↩️</span> 回覆
            </button>
            {msgMenu.msg.isMine && msgMenu.msg.content !== '[已收回]' && (
              <button
                onClick={() => startEdit(msgMenu.msg)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm text-white/80 text-left transition-colors border-t border-white/8"
              >
                <Pencil className="w-4 h-4" /> 編輯
              </button>
            )}
            {msgMenu.msg.isMine && (
              <button
                onClick={() => recallMsg(msgMenu.msg.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm text-white/80 text-left transition-colors border-t border-white/8"
              >
                <span>🔄</span> 收回
              </button>
            )}
            <button
              onClick={() => { setBubble({ content: msgMenu.msg.content, x: msgMenu.x - 110, y: msgMenu.y - 60 }); setMsgMenu(null) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm text-white/80 text-left transition-colors border-t border-white/8"
            >
              <span>🫧</span> 懸浮球
            </button>
            {msgMenu.msg.isMine && (
              <button
                onClick={() => deleteMsg(msgMenu.msg.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/10 text-sm text-rose-400 text-left transition-colors border-t border-white/8"
              >
                <span>🗑️</span> 刪除
              </button>
            )}
          </div>
        </>
      )}

      {/* Draggable DM bubble */}
      {bubble && <DraggableBubble bubble={bubble} onClose={() => setBubble(null)} />}
    </div>
  )
}

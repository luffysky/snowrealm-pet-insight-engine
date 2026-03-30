'use client'

export const FLOATING_CHAT_ENABLED_KEY = 'floating-chat-enabled'

export function setFloatingChatEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(FLOATING_CHAT_ENABLED_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent('floating-chat-toggle', { detail: { enabled } }))
}

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MessageCircle, X, Send, ChevronRight, Minus, Smile, Paperclip, Loader2 } from 'lucide-react'
import { GifPicker } from './GifPicker'

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
  fromUserId: string
  content: string
  createdAt: string
  contentType?: string
}

interface WindowState {
  conv: Conversation
  minimized: boolean
}

interface StickerPack {
  id: string
  name: string
  coverUrl: string | null
  stickers: { id: string; url: string; name?: string }[]
}

type MediaPanel = 'sticker' | 'gif' | null

const HIDDEN_PREFIXES = ['/messages', '/login', '/register', '/super-login', '/api', '/story/create', '/write']
const POS_KEY = 'floating_chat_pos'
const ENABLED_KEY = 'floating_chat_enabled'
const BTN = 48
const DRAG_THRESHOLD = 6
const WIN_W = 280
const WIN_H = 380

function clamp(x: number, y: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x, y }
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: Math.max(0, Math.min(vw - BTN, x)),
    y: Math.max(vh * 0.2, Math.min(vh * 0.8 - BTN, y)),
  }
}

function getInitialPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 300, y: 500 }
  try {
    const saved = localStorage.getItem(POS_KEY)
    if (saved) {
      const p = JSON.parse(saved) as { x: number; y: number }
      return clamp(p.x, p.y)
    }
  } catch { /* ignore */ }
  return clamp(window.innerWidth - BTN - 16, window.innerHeight - BTN - 90)
}

function Avatar({ user, size }: { user: Pick<Conversation, 'displayName' | 'avatarUrl'>; size: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover`
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" className={cls} />
  return (
    <div className={`${cls} bg-gradient-to-br from-sky-500/40 to-indigo-500/40 flex items-center justify-center text-white font-bold`}
      style={{ fontSize: size * 1.5 }}>
      {(user.displayName ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ── Message content renderer ──────────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  if (content.startsWith('[STICKER]:')) {
    return <img src={content.slice(10)} alt="貼圖" className="w-20 h-20 object-contain" />
  }
  if (content.startsWith('[gif:')) {
    const url = content.slice(5, -1)
    return <img src={url} alt="GIF" className="max-w-[180px] rounded-xl" />
  }
  if (content.startsWith('[img:')) {
    const url = content.slice(5, -1)
    return (
      <img
        src={url} alt=""
        className="max-w-[180px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(url, '_blank')}
      />
    )
  }
  if (content.startsWith('[video:')) {
    return <video src={content.slice(7, -1)} controls className="max-w-[220px] rounded-xl" />
  }
  if (content.startsWith('[audio:')) {
    return <audio src={content.slice(7, -1)} controls style={{ maxWidth: 220, height: 32 }} />
  }
  if (content.startsWith('[AUDIO]:')) {
    return <audio src={content.slice(8)} controls style={{ maxWidth: 220, height: 32 }} />
  }
  if (content.startsWith('[file:')) {
    const inner = content.slice(6, -1)
    const sep = inner.indexOf('|')
    const name = sep >= 0 ? inner.slice(0, sep) : '檔案'
    const url = sep >= 0 ? inner.slice(sep + 1) : inner
    return (
      <a href={url} download={name} target="_blank" rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-100 underline underline-offset-2">
        <Paperclip className="w-3 h-3 shrink-0" />{name}
      </a>
    )
  }
  return <>{content}</>
}

function isNakedContent(content: string): boolean {
  return (
    content.startsWith('[STICKER]:') ||
    content.startsWith('[gif:') ||
    content.startsWith('[img:') ||
    content.startsWith('[video:')
  )
}

// ── Per-contact floating chat window ──────────────────────────────────────────
interface ChatWindowProps {
  win: WindowState
  meId: string
  index: number
  onClose: (userId: string) => void
  onToggleMinimize: (userId: string) => void
  onFocus: (userId: string) => void
}

function FloatingChatWindow({ win, meId, index, onClose, onToggleMinimize, onFocus }: ChatWindowProps) {
  const { conv, minimized } = win
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaPanel, setMediaPanel] = useState<MediaPanel>(null)
  const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([])
  const [stickerPackIdx, setStickerPackIdx] = useState(0)
  const [loadingStickers, setLoadingStickers] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rightOffset = 16 + (WIN_W + 8) * index + BTN + 8

  const loadMessages = useCallback(() => {
    fetch(`/api/admin/social/messages/${conv.userId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { messages?: Message[] } | null) => {
        if (d?.messages) setMessages(d.messages.slice(-30))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [conv.userId])

  useEffect(() => {
    if (!minimized) loadMessages()
  }, [minimized, loadMessages])

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!minimized) requestAnimationFrame(() => inputRef.current?.focus())
  }, [minimized])

  const sendContent = async (content: string) => {
    if (sending) return
    setSending(true)
    const tmpMsg: Message = { id: `tmp-${Date.now()}`, fromUserId: meId, content, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tmpMsg])
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
    await fetch('/api/admin/social/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: conv.userId, content }),
    }).catch(() => {})
    setSending(false)
    loadMessages()
  }

  const send = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    await sendContent(content)
  }

  const uploadFile = async (file: File) => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/social/messages/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const { url, mediaType, filename } = await res.json() as { url: string; mediaType: string; filename: string }
      let content = ''
      if (mediaType === 'img') content = `[img:${url}]`
      else if (mediaType === 'video') content = `[video:${url}]`
      else if (mediaType === 'audio') content = `[audio:${url}]`
      else content = `[file:${filename}|${url}]`
      await sendContent(content)
    } catch { /* ignore */ } finally {
      setUploading(false)
    }
  }

  const loadStickers = async () => {
    if (stickerPacks.length > 0) return
    setLoadingStickers(true)
    try {
      const res = await fetch('/api/stickers?type=sticker')
      const data = await res.json() as { packs: StickerPack[] }
      setStickerPacks(data.packs ?? [])
    } catch { /* ignore */ } finally {
      setLoadingStickers(false)
    }
  }

  const sendSticker = (url: string) => { void sendContent(`[STICKER]:${url}`); setMediaPanel(null) }
  const sendGif = (url: string) => { void sendContent(`[gif:${url}]`); setMediaPanel(null) }

  const togglePanel = (panel: MediaPanel) => {
    setMediaPanel(prev => prev === panel ? null : panel)
    if (panel === 'sticker') void loadStickers()
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{ position: 'fixed', right: rightOffset, bottom: 16, width: WIN_W, zIndex: 50 }}
      onPointerDown={() => onFocus(conv.userId)}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-2xl cursor-pointer select-none"
        style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        onClick={() => onToggleMinimize(conv.userId)}
      >
        <Avatar user={conv} size={7} />
        <p className="flex-1 text-xs font-semibold text-white/85 truncate">{conv.displayName ?? '用戶'}</p>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onToggleMinimize(conv.userId) }}
          className="text-white/30 hover:text-white/70 p-0.5 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onClose(conv.userId) }}
          className="text-white/30 hover:text-rose-400 p-0.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div
          style={{
            height: WIN_H,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15,23,42,0.97)',
            borderRadius: '0 0 16px 16px',
            border: '1px solid rgba(255,255,255,0.07)',
            borderTop: 'none',
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
            {!loaded ? (
              <div className="flex justify-center pt-8">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-white/25 text-xs pt-8">還沒有訊息</p>
            ) : messages.map(msg => {
              const isMine = msg.fromUserId === meId
              const naked = isNakedContent(msg.content)
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {naked ? (
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <MessageContent content={msg.content} />
                      <span className="text-[9px] mt-0.5 text-white/30">{formatTime(msg.createdAt)}</span>
                    </div>
                  ) : (
                    <div className={`max-w-[82%] px-2.5 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
                      isMine ? 'bg-sky-600/80 text-white rounded-br-sm' : 'bg-white/10 text-white/80 rounded-bl-sm'
                    }`}>
                      <MessageContent content={msg.content} />
                      <span className={`block text-[9px] mt-0.5 ${isMine ? 'text-sky-200/50 text-right' : 'text-white/30'}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Sticker panel */}
          {mediaPanel === 'sticker' && (
            <div className="border-t border-white/[0.06] shrink-0" style={{ background: 'rgba(10,18,36,0.98)' }}>
              {/* Pack tabs */}
              {stickerPacks.length > 0 && (
                <div className="flex gap-1 px-2 pt-1.5 pb-1 overflow-x-auto">
                  {stickerPacks.map((pack, i) => (
                    <button
                      key={pack.id}
                      onClick={() => setStickerPackIdx(i)}
                      className={`shrink-0 w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                        stickerPackIdx === i ? 'border-sky-500/60 ring-1 ring-sky-500/40' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {pack.coverUrl
                        ? <img src={pack.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="flex items-center justify-center w-full h-full text-[10px]">🎭</span>}
                    </button>
                  ))}
                </div>
              )}
              {/* Grid */}
              <div className="grid grid-cols-5 gap-1 p-2 overflow-y-auto" style={{ maxHeight: 148 }}>
                {loadingStickers ? (
                  <div className="col-span-5 flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                  </div>
                ) : (stickerPacks[stickerPackIdx]?.stickers ?? []).length === 0 ? (
                  <p className="col-span-5 text-center text-white/25 text-xs py-4">
                    {loadingStickers ? '' : '沒有貼圖'}
                  </p>
                ) : (stickerPacks[stickerPackIdx]?.stickers ?? []).map(s => (
                  <button
                    key={s.id}
                    onClick={() => sendSticker(s.url)}
                    className="aspect-square rounded-lg overflow-hidden hover:bg-white/10 p-0.5 transition-colors"
                  >
                    <img src={s.url} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIF panel */}
          {mediaPanel === 'gif' && (
            <div className="border-t border-white/[0.06] shrink-0 overflow-hidden" style={{ maxHeight: 260 }}>
              <GifPicker onSelect={sendGif} onClose={() => setMediaPanel(null)} />
            </div>
          )}

          {/* Input area */}
          <div className="px-2 py-1.5 border-t border-white/[0.06] shrink-0">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 mb-1.5">
              <button
                onClick={() => togglePanel('sticker')}
                className={`p-1.5 rounded-lg transition-colors ${
                  mediaPanel === 'sticker' ? 'text-amber-400 bg-amber-400/10' : 'text-white/35 hover:text-white/70 hover:bg-white/8'
                }`}
                title="貼圖"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => togglePanel('gif')}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-bold leading-none transition-colors ${
                  mediaPanel === 'gif' ? 'text-purple-400 bg-purple-400/10' : 'text-white/35 hover:text-white/70 hover:bg-white/8'
                }`}
                title="GIF"
              >
                GIF
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-40"
                title="傳送圖片 / 檔案"
              >
                {uploading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Paperclip className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.zip,.doc,.docx"
                onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f) }}
              />
            </div>

            {/* Text input + send */}
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
                onFocus={() => setMediaPanel(null)}
                placeholder="傳送訊息..."
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-sky-500/40"
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || sending}
                className="p-1.5 bg-sky-500/30 hover:bg-sky-500/50 disabled:opacity-40 rounded-lg text-sky-300 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {minimized && (
        <div
          className="h-1 rounded-b-xl"
          style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        />
      )}
    </div>
  )
}

// ── Main FloatingChat button + list panel ──────────────────────────────────────
export function FloatingChat() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<{ userId: string } | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unread, setUnread] = useState(0)
  const [windows, setWindows] = useState<WindowState[]>([])
  const [enabled, setEnabled] = useState(true)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const didDrag = useRef(false)
  const dragOffset = useRef({ dx: 0, dy: 0 })

  const hidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => {
    setPos(getInitialPos())
    const v = localStorage.getItem(ENABLED_KEY)
    setEnabled(v !== 'false')
    const handler = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail)
    window.addEventListener('floating-chat-toggle', handler)
    return () => window.removeEventListener('floating-chat-toggle', handler)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { userId?: string } | null) => { if (d?.userId) setMe({ userId: d.userId }) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!me) return
    const load = () => {
      fetch('/api/admin/social/messages/unread')
        .then(r => r.ok ? r.json() : null)
        .then((d: { count?: number } | null) => { if (d?.count !== undefined) setUnread(d.count) })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 30_000)
    window.addEventListener('dm-read', load)
    return () => { clearInterval(t); window.removeEventListener('dm-read', load) }
  }, [me])

  useEffect(() => {
    if (!open || !me) return
    fetch('/api/admin/social/messages')
      .then(r => r.ok ? r.json() : null)
      .then((d: { conversations?: Conversation[] } | null) => {
        if (d?.conversations) setConversations(d.conversations.slice(0, 8))
      })
      .catch(() => {})
  }, [open, me])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openWindow = (conv: Conversation) => {
    setWindows(prev => {
      const exists = prev.find(w => w.conv.userId === conv.userId)
      if (exists) {
        return [...prev.filter(w => w.conv.userId !== conv.userId), { conv, minimized: false }]
      }
      const base = prev.length >= 4 ? prev.slice(1) : prev
      return [...base, { conv, minimized: false }]
    })
    setOpen(false)
  }

  const closeWindow = (userId: string) => {
    setWindows(prev => prev.filter(w => w.conv.userId !== userId))
  }

  const toggleMinimize = (userId: string) => {
    setWindows(prev => prev.map(w =>
      w.conv.userId === userId ? { ...w, minimized: !w.minimized } : w
    ))
  }

  const focusWindow = (userId: string) => {
    setWindows(prev => {
      const win = prev.find(w => w.conv.userId === userId)
      if (!win) return prev
      return [...prev.filter(w => w.conv.userId !== userId), win]
    })
  }

  const onBtnPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragging.current = true
    didDrag.current = false
    const p = pos ?? getInitialPos()
    dragOffset.current = { dx: e.clientX - p.x, dy: e.clientY - p.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onBtnPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return
    const p = pos ?? getInitialPos()
    const dx = e.clientX - (p.x + dragOffset.current.dx)
    const dy = e.clientY - (p.y + dragOffset.current.dy)
    if (!didDrag.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) didDrag.current = true
    if (!didDrag.current) return
    const next = clamp(e.clientX - dragOffset.current.dx, e.clientY - dragOffset.current.dy)
    setPos(next)
    try { localStorage.setItem(POS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const onBtnPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!didDrag.current) {
      setOpen(o => !o)
    }
  }

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  if (hidden || !me || !pos || !enabled) return null

  const panelOnLeft = pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)

  return (
    <>
      {/* Per-contact floating windows */}
      {windows.map((win, idx) => (
        <FloatingChatWindow
          key={win.conv.userId}
          win={win}
          meId={me.userId}
          index={idx}
          onClose={closeWindow}
          onToggleMinimize={toggleMinimize}
          onFocus={focusWindow}
        />
      ))}

      {/* Main floating button + conversation list */}
      <div
        ref={panelRef}
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 60, touchAction: 'none' }}
      >
        {/* Conversation list panel */}
        {open && (
          <div
            className="absolute w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            style={{
              bottom: `${BTN + 8}px`,
              right: panelOnLeft ? 0 : 'auto',
              left: panelOnLeft ? 'auto' : 0,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-white/80">訊息</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { router.push('/messages'); setOpen(false) }}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  查看全部
                </button>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation list */}
            <div className="max-h-72 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-center text-white/25 text-xs py-6">還沒有對話</p>
              ) : conversations.map(conv => {
                const isOpen = windows.some(w => w.conv.userId === conv.userId)
                return (
                  <button
                    key={conv.userId}
                    onClick={() => openWindow(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${isOpen ? 'bg-white/[0.03]' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar user={conv} size={8} />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                      {isOpen && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate">{conv.displayName ?? '用戶'}</p>
                      <p className="text-[10px] text-white/35 truncate mt-0.5">{conv.lastMessagePreview}</p>
                    </div>
                    <span className="text-[9px] text-white/25 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <button
              onClick={() => { router.push('/messages'); setOpen(false) }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-white/8 text-xs text-sky-400/70 hover:text-sky-400 hover:bg-sky-900/20 transition-colors"
            >
              開啟訊息頁面 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Floating trigger button */}
        <button
          onPointerDown={onBtnPointerDown}
          onPointerMove={onBtnPointerMove}
          onPointerUp={onBtnPointerUp}
          style={{ width: BTN, height: BTN, touchAction: 'none', cursor: dragging.current ? 'grabbing' : 'grab' }}
          className="relative rounded-full shadow-xl shadow-black/30
                     flex items-center justify-center
                     bg-gradient-to-br from-sky-500 to-indigo-600
                     hover:from-sky-400 hover:to-indigo-500
                     active:scale-95 transition-colors select-none"
        >
          {open
            ? <X className="w-5 h-5 text-white pointer-events-none" />
            : <MessageCircle className="w-5 h-5 text-white pointer-events-none" />
          }
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                             bg-rose-500 text-white text-[9px] font-bold rounded-full
                             flex items-center justify-center leading-none shadow-md pointer-events-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </div>
    </>
  )
}

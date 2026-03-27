'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Send, Loader2, X, Paperclip, Smile, ImageIcon, Music, File as FileIcon, Gift, Pencil, Plus, Palette, Play, Pause, Volume2 } from 'lucide-react'
import { GifPicker } from '@/components/social/GifPicker'

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

// Lightbox for full-size media view
function Lightbox({ url, type, onClose }: { url: string; type: 'image' | 'video'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
        <X className="w-7 h-7" />
      </button>
      {type === 'image' ? (
        <img src={url} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
      ) : (
        <video src={url} controls autoPlay className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
      )}
    </div>
  )
}

// ─── Chat themes (background + bubble colours) ───
interface ChatTheme {
  key: string; label: string; emoji: string
  bg: React.CSSProperties
  myBg: string; myText: string; myShadow?: string
  theirBg: string; theirText: string; theirBorder?: string
}

const CHAT_THEMES: ChatTheme[] = [
  {
    key: 'default', label: '預設', emoji: '🌑',
    bg: {},
    myBg: 'linear-gradient(135deg,#f59e0b,#ea580c)', myText: '#fff', myShadow: '0 4px 14px rgba(245,158,11,.3)',
    theirBg: 'rgba(30,41,59,.95)', theirText: 'rgba(255,255,255,.9)', theirBorder: '1px solid rgba(255,255,255,.06)',
  },
  {
    key: 'midnight', label: '深夜', emoji: '🌌',
    bg: { background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)' },
    myBg: 'linear-gradient(135deg,#3b82f6,#6366f1)', myText: '#fff', myShadow: '0 4px 14px rgba(59,130,246,.3)',
    theirBg: 'rgba(30,27,75,.7)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(99,102,241,.15)',
  },
  {
    key: 'aurora', label: '極光', emoji: '🌈',
    bg: { background: 'linear-gradient(160deg,#0d1117 0%,#0d2338 35%,#0a1f1a 70%,#0d1117 100%)' },
    myBg: 'linear-gradient(135deg,#06b6d4,#0891b2)', myText: '#fff', myShadow: '0 4px 14px rgba(6,182,212,.3)',
    theirBg: 'rgba(6,78,59,.5)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(6,182,212,.15)',
  },
  {
    key: 'rose', label: '玫瑰', emoji: '🌹',
    bg: { background: 'linear-gradient(160deg,#1c0914 0%,#3b0a1e 100%)' },
    myBg: 'linear-gradient(135deg,#f43f5e,#e11d48)', myText: '#fff', myShadow: '0 4px 14px rgba(244,63,94,.3)',
    theirBg: 'rgba(59,10,30,.7)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(244,63,94,.15)',
  },
  {
    key: 'forest', label: '森林', emoji: '🌲',
    bg: { background: 'linear-gradient(160deg,#0f2116 0%,#052e16 100%)' },
    myBg: 'linear-gradient(135deg,#10b981,#059669)', myText: '#fff', myShadow: '0 4px 14px rgba(16,185,129,.3)',
    theirBg: 'rgba(5,46,22,.7)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(16,185,129,.12)',
  },
  {
    key: 'amber', label: '琥珀', emoji: '🟡',
    bg: { background: 'linear-gradient(160deg,#1a0f00 0%,#2d1b00 100%)' },
    myBg: 'linear-gradient(135deg,#f59e0b,#d97706)', myText: '#1a0f00', myShadow: '0 4px 14px rgba(245,158,11,.25)',
    theirBg: 'rgba(45,27,0,.8)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(245,158,11,.1)',
  },
  {
    key: 'neon', label: '霓虹', emoji: '⚡',
    bg: { background: 'linear-gradient(160deg,#020617 0%,#0c0a1e 100%)' },
    myBg: 'linear-gradient(135deg,#22d3ee,#0891b2)', myText: '#000', myShadow: '0 0 22px rgba(34,211,238,.45)',
    theirBg: 'rgba(12,10,30,.85)', theirText: 'rgba(34,211,238,.9)', theirBorder: '1px solid rgba(34,211,238,.2)',
  },
  {
    key: 'purple', label: '紫晶', emoji: '💜',
    bg: { background: 'linear-gradient(160deg,#1a0533 0%,#2d1058 100%)' },
    myBg: 'linear-gradient(135deg,#a855f7,#7c3aed)', myText: '#fff', myShadow: '0 4px 14px rgba(168,85,247,.35)',
    theirBg: 'rgba(45,16,88,.7)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(168,85,247,.15)',
  },
  {
    key: 'coral', label: '珊瑚', emoji: '🪸',
    bg: { background: 'linear-gradient(160deg,#1a0a07 0%,#3b1208 100%)' },
    myBg: 'linear-gradient(135deg,#fb923c,#f97316)', myText: '#fff', myShadow: '0 4px 14px rgba(251,146,60,.3)',
    theirBg: 'rgba(59,18,8,.7)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(251,146,60,.12)',
  },
  {
    key: 'slate', label: '石板', emoji: '🩶',
    bg: { background: 'linear-gradient(160deg,#0f1117 0%,#1e293b 100%)' },
    myBg: 'linear-gradient(135deg,#64748b,#475569)', myText: '#fff', myShadow: '0 4px 14px rgba(100,116,139,.25)',
    theirBg: 'rgba(30,41,59,.8)', theirText: 'rgba(255,255,255,.85)', theirBorder: '1px solid rgba(255,255,255,.06)',
  },
]

interface BgEffects { blur: number; brightness: number; dim: number; saturate: number; hue: number }
const DEFAULT_EFFECTS: BgEffects = { blur: 0, brightness: 100, dim: 0, saturate: 100, hue: 0 }

const THEME_STORAGE_KEY = 'dm_chat_theme'

// ─── Custom Audio Player ───
function AudioPlayer({ url, isMine }: { url: string; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 w-[220px] ${isMine ? 'bg-white/15' : 'bg-white/8'}`}>
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setLoading(false) }}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onError={() => setLoading(false)}
        preload="metadata"
        className="hidden"
      />
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isMine ? 'bg-white/25 hover:bg-white/35' : 'bg-amber-500/30 hover:bg-amber-500/50'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/60" />
        ) : playing ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <Volume2 className="w-3 h-3 text-white/40" />
          <span className="text-[10px] text-white/50 tabular-nums">{fmt(playing ? current : duration)}</span>
        </div>
        {/* Progress bar */}
        <div
          className="h-1 rounded-full bg-white/15 cursor-pointer relative overflow-hidden"
          onClick={e => {
            if (!audioRef.current || !duration) return
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            audioRef.current.currentTime = ratio * duration
          }}
        >
          <div
            className={`h-full rounded-full transition-none ${isMine ? 'bg-white/70' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Render message content (text, image, video, audio, file, gif)
function MessageContent({ content, edited, isMine, onLightbox }: { content: string; edited?: boolean; isMine?: boolean; onLightbox?: (url: string, type: 'image' | 'video') => void }) {
  if (content === '[已收回]') {
    return <p className="text-sm text-white/30 italic">已收回訊息</p>
  }
  if (content.startsWith('[img:') && content.endsWith(']')) {
    const url = content.slice(5, -1)
    return (
      <img
        src={url} alt=""
        className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onLightbox?.(url, 'image')}
      />
    )
  }
  if (content.startsWith('[gif:') && content.endsWith(']')) {
    const url = content.slice(5, -1)
    return (
      <img
        src={url} alt="GIF"
        className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onLightbox?.(url, 'image')}
      />
    )
  }
  if (content.startsWith('[video:') && content.endsWith(']')) {
    const url = content.slice(7, -1)
    return (
      <div
        className="relative group cursor-pointer rounded-2xl overflow-hidden max-w-[260px] bg-black"
        onClick={() => onLightbox?.(url, 'video')}
      >
        <video src={url} className="w-full max-h-52 object-cover block pointer-events-none" preload="metadata" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 text-white/80 text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          影片
        </div>
      </div>
    )
  }
  if (content.startsWith('[audio:') && content.endsWith(']')) {
    const url = content.slice(7, -1)
    return <AudioPlayer url={url} isMine={isMine ?? false} />
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
    return (
      <img
        src={url} alt="GIF"
        className="max-w-full rounded-xl max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onLightbox?.(url, 'image')}
      />
    )
  }
  // Check if it's a single big sticker emoji
  const isSticker = STICKER_EMOJI.includes(content.trim()) || (content.trim().length <= 4 && /\p{Emoji}/u.test(content))
  if (isSticker) {
    return <span className="text-5xl leading-none block">{content}</span>
  }
  return <p className={`text-sm break-words leading-relaxed ${edited ? 'font-semibold' : ''}`}>{content}</p>
}

/** Returns true when the content should render without a chat bubble background */
function isNakedContent(content: string): boolean {
  if (content === '[已收回]') return false
  if (content.startsWith('[img:') || content.startsWith('[gif:') ||
      content.startsWith('[video:') || content.startsWith('[audio:') ||
      content.startsWith('[file:')) return true
  const trimmed = content.trim()
  // Single emoji sticker (≤ 4 chars, contains emoji)
  if (trimmed.length <= 4 && /\p{Emoji}/u.test(trimmed)) return true
  return false
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
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [msgMenu, setMsgMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [editingMsg, setEditingMsg] = useState<{ id: string } | null>(null)
  const [editInput, setEditInput] = useState('')
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null)
  const [themeKey, setThemeKey] = useState('default')
  const [bgCustomUrl, setBgCustomUrl] = useState('')
  const [effects, setEffects] = useState<BgEffects>(DEFAULT_EFFECTS)
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [themeTab, setThemeTab] = useState<'theme' | 'bg' | 'fx'>('theme')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string }> : null)
      .then(d => {
        if (!d?.userId) { router.push(`/login?redirect=/messages`); return }
        setMeId(d.userId)
      }).catch(() => {})
    // Load saved chat theme
    try {
      const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}') as {
        themeKey?: string; custom?: string; effects?: Partial<BgEffects>
      }
      if (saved.themeKey) setThemeKey(saved.themeKey)
      if (saved.custom) setBgCustomUrl(saved.custom)
      if (saved.effects) setEffects(e => ({ ...e, ...saved.effects }))
    } catch { /* ignore */ }
  }, [router])

  useEffect(() => {
    if (!meId) return
    fetch('/api/admin/social/messages')
      .then(r => r.ok ? r.json() as Promise<{ conversations: Conversation[] }> : null)
      .then(d => {
        if (d?.conversations) {
          setConversations(d.conversations)
          // 從 URL ?uid= 恢復對話（重整或分享連結）
          const uid = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('uid')
            : null
          if (uid) {
            const found = d.conversations.find(c => c.userId === uid)
            if (found) setActive(found)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [meId])

  // 監聽瀏覽器上一頁/下一頁（popstate）
  useEffect(() => {
    const onPop = () => {
      const uid = new URLSearchParams(window.location.search).get('uid')
      if (!uid) {
        setActive(null)
      } else {
        setConversations(prev => {
          const found = prev.find(c => c.userId === uid)
          if (found) setActive(found)
          return prev
        })
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

  // 開啟對話：pushState 加一筆歷史，這樣返回時能回到列表
  const openConversation = (conv: Conversation) => {
    setActive(conv)
    window.history.pushState(null, '', `/messages?uid=${conv.userId}`)
  }

  // 關閉對話：使用 router.back() 讓瀏覽器回到上一頁歷史（/messages 列表）
  const closeConversation = () => {
    router.back()
  }

  const send = async () => {
    if (!input.trim() || sending || !active) return
    const text = input.trim()
    setInput('')
    await sendContent(text)
  }

  const uploadFile = async (file: File) => {
    if (!active) return
    setUploading(true)
    setUploadError(null)
    // Reset file input so the same file can be re-selected after error
    if (fileInputRef.current) fileInputRef.current.value = ''
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/social/messages/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        setUploadError(errData.error ?? `上傳失敗（${res.status}）`)
        setTimeout(() => setUploadError(null), 4000)
        return
      }
      const { url, mediaType, filename } = await res.json() as { url: string; mediaType: string; filename: string }
      let content = ''
      if (mediaType === 'img') content = `[img:${url}]`
      else if (mediaType === 'video') content = `[video:${url}]`
      else if (mediaType === 'audio') content = `[audio:${url}]`
      else content = `[file:${filename}|${url}]`
      await sendContent(content)
    } catch {
      setUploadError('上傳失敗，請檢查網路連線')
      setTimeout(() => setUploadError(null), 4000)
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

  const openMenu = (msg: Message, x: number, y: number) => {
    setMsgMenu({ msg, x, y })
  }

  const startLongPress = (e: React.PointerEvent, msg: Message) => {
    const { clientX, clientY } = e
    longPressTimer.current = setTimeout(() => {
      openMenu(msg, clientX, clientY)
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    openMenu(msg, e.clientX, e.clientY)
  }

  const forwardMsgTo = async (targetUserId: string, targetDisplayName: string | null) => {
    if (!forwardingMsg || !active) return
    const rawContent = forwardingMsg.content.includes('\n')
      ? forwardingMsg.content.split('\n').slice(1).join('\n')
      : forwardingMsg.content
    if (rawContent === '[已收回]' || rawContent === '[已刪除]') return

    const fwdContent = `[轉傳自 ${forwardingMsg.fromName ?? '對方'}]\n${rawContent}`
    const targetName = targetDisplayName ?? targetUserId.slice(0, 8)
    setForwardingMsg(null)

    // If forwarding to current conversation, append locally
    if (targetUserId === active.userId) {
      const optimistic: Message = {
        id: `fwd-${Date.now()}`,
        content: fwdContent,
        createdAt: new Date().toISOString(),
        isMine: true,
        fromName: null,
        fromAvatar: null,
        editedAt: null,
      }
      setMessages(prev => [...prev, optimistic])
    }

    await fetch(`/api/admin/social/messages/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: fwdContent }),
    }).catch(() => {})

    if (targetUserId !== active.userId) {
      alert(`已轉傳給 ${targetName}`)
    }
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

  const persist = useCallback((k: string, c: string, fx: BgEffects) => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeKey: k, custom: c, effects: fx }))
  }, [])

  const applyTheme = useCallback((key: string) => {
    setThemeKey(key)
    persist(key, bgCustomUrl, effects)
  }, [bgCustomUrl, effects, persist])

  const applyCustomBg = useCallback((url: string) => {
    setBgCustomUrl(url)
    persist(themeKey, url, effects)
  }, [themeKey, effects, persist])

  const applyEffects = useCallback((next: BgEffects) => {
    setEffects(next)
    persist(themeKey, bgCustomUrl, next)
  }, [themeKey, bgCustomUrl, persist])

  const activeTheme = CHAT_THEMES.find(t => t.key === themeKey) ?? CHAT_THEMES[0]

  const bgLayerStyle = (): React.CSSProperties => {
    if (bgCustomUrl) {
      return { backgroundImage: `url(${bgCustomUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    return activeTheme.bg
  }

  const fxFilter = (): string => {
    const parts: string[] = []
    if (effects.blur > 0)          parts.push(`blur(${effects.blur}px)`)
    if (effects.brightness !== 100) parts.push(`brightness(${effects.brightness}%)`)
    if (effects.saturate !== 100)   parts.push(`saturate(${effects.saturate}%)`)
    if (effects.hue !== 0)          parts.push(`hue-rotate(${effects.hue}deg)`)
    return parts.join(' ') || 'none'
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
      {/* 列表頂部導覽 — 開啟對話時隱藏 */}
      {!active && (
        <nav className="shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/[0.06]">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-bold text-lg tracking-tight">訊息</h1>
          </div>
        </nav>
      )}

      <div className="flex-1 flex max-w-2xl mx-auto w-full min-h-0">
        {/* Conversation list — hidden on mobile when chat open */}
        <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 md:border-r md:border-white/8 shrink-0 overflow-y-auto`}>
          {loading ? (
            <div className="flex justify-center pt-16">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-24 px-6 text-white/25">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 opacity-50" />
              </div>
              <p className="text-sm font-medium mb-1">還沒有訊息</p>
              <p className="text-xs text-white/15">前往別人的個人頁面發起對話</p>
            </div>
          ) : (
            <div className="py-2">
              {conversations.map(c => (
                <button
                  key={c.userId}
                  onClick={() => openConversation(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${active?.userId === c.userId ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {c.avatarUrl
                        ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-amber-500/40 to-purple-600/40 flex items-center justify-center text-sm font-bold text-white/80">{initials(c.displayName)}</div>
                      }
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${c.unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>{c.displayName ?? '用戶'}</span>
                      <span className="text-[11px] text-white/30 shrink-0 tabular-nums">{formatTime(c.lastMessageAt)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.unreadCount > 0 ? 'text-white/60 font-medium' : 'text-white/35'}`}>{c.lastMessagePreview}</p>
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
          <div className="flex-1 flex flex-col min-h-0">
            {/* 名子層 — 頂部（手機 + 桌機都顯示） */}
            <div className="shrink-0 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
              <button onClick={closeConversation} className="text-white/40 hover:text-white transition-colors p-1 -ml-1 rounded-lg hover:bg-white/8">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10">
                {active.avatarUrl
                  ? <img src={active.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-amber-500/40 to-purple-600/40 flex items-center justify-center text-xs font-bold text-white/80">{initials(active.displayName)}</div>
                }
              </div>
              <span className="font-semibold flex-1 truncate text-white">{active.displayName ?? '私訊'}</span>
              <button
                onClick={() => setThemePanelOpen(p => !p)}
                className={`p-1.5 rounded-xl transition-colors ${themePanelOpen ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
                title="主題與背景"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>

            {/* ── 主題面板 ── */}
            {themePanelOpen && (
              <div className="shrink-0 bg-slate-950/96 backdrop-blur-2xl border-b border-white/8">
                {/* Tabs */}
                <div className="flex border-b border-white/6">
                  {([['theme','🎨 主題'],['bg','🖼️ 背景'],['fx','✨ 濾鏡']] as const).map(([k,l]) => (
                    <button key={k} onClick={() => setThemeTab(k)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-colors ${themeTab === k ? 'text-white border-b-2 border-amber-400' : 'text-white/35 hover:text-white/60'}`}
                    >{l}</button>
                  ))}
                </div>

                {/* ── Tab: 主題 ── */}
                {themeTab === 'theme' && (
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-5 gap-2">
                      {CHAT_THEMES.map(t => (
                        <button key={t.key} onClick={() => applyTheme(t.key)}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                            themeKey === t.key
                              ? 'border-amber-400/60 bg-amber-400/8'
                              : 'border-white/8 hover:border-white/20'
                          }`}
                        >
                          {/* mini preview: bg + two bubbles */}
                          <div className="w-10 h-8 rounded-xl overflow-hidden relative flex items-center justify-center gap-0.5 px-1"
                            style={t.bg.background ? { background: (t.bg as { background: string }).background } : { background: '#0f172a' }}
                          >
                            <div className="h-2.5 rounded-full w-3" style={{ background: t.theirBg.includes('rgba') ? t.theirBg : t.theirBg }} />
                            <div className="h-2.5 rounded-full w-4 ml-auto" style={{ background: t.myBg }} />
                          </div>
                          <span className="text-[10px] text-white/60">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tab: 背景 ── */}
                {themeTab === 'bg' && (
                  <div className="px-4 py-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={bgCustomUrl}
                        onChange={e => setBgCustomUrl(e.target.value)}
                        placeholder="貼上圖片網址 (https://...)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-amber-400/40"
                      />
                      <button
                        onClick={() => applyCustomBg(bgCustomUrl)}
                        disabled={!bgCustomUrl.startsWith('http')}
                        className="px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-xs text-amber-300 hover:bg-amber-500/30 disabled:opacity-30 transition-colors shrink-0"
                      >套用</button>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer w-fit">
                      <span className="text-[11px] text-white/35 hover:text-white/60 transition-colors flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> 從裝置上傳圖片
                      </span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return
                          const reader = new FileReader()
                          reader.onload = ev => { const url = ev.target?.result as string; setBgCustomUrl(url); applyCustomBg(url) }
                          reader.readAsDataURL(f)
                        }}
                      />
                    </label>
                    {bgCustomUrl && (
                      <button onClick={() => { setBgCustomUrl(''); persist(themeKey, '', effects) }}
                        className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors">
                        ✕ 清除自訂背景
                      </button>
                    )}
                  </div>
                )}

                {/* ── Tab: 濾鏡 ── */}
                {themeTab === 'fx' && (
                  <div className="px-4 py-3 space-y-3">
                    {([
                      ['blur',       '模糊',   0,   20,  1,   'px'],
                      ['brightness', '亮度',   50, 150,  1,   '%'],
                      ['dim',        '暗化',   0,   80,  1,   '%'],
                      ['saturate',   '飽和度', 0,  200,  1,   '%'],
                      ['hue',        '色調',   0,  360,  1,   '°'],
                    ] as [keyof BgEffects, string, number, number, number, string][]).map(([k, label, min, max, step, unit]) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className="text-[11px] text-white/40 w-14 shrink-0">{label}</span>
                        <input type="range" min={min} max={max} step={step} value={effects[k]}
                          onChange={e => applyEffects({ ...effects, [k]: Number(e.target.value) })}
                          className="flex-1 accent-amber-400 h-1.5"
                        />
                        <span className="text-[11px] text-white/30 w-10 text-right tabular-nums shrink-0">
                          {effects[k]}{unit}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => applyEffects(DEFAULT_EFFECTS)}
                      className="text-[11px] text-white/30 hover:text-white/60 transition-colors mt-1">
                      ↺ 重設濾鏡
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 內容層 — 帶分層背景的可捲動訊息區 */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
              {/* 背景層（套用濾鏡，blur 時外擴避免邊緣模糊） */}
              <div
                className="absolute pointer-events-none z-0 transition-all duration-500"
                style={{
                  inset: effects.blur > 0 ? `-${effects.blur * 3}px` : '0',
                  filter: fxFilter(),
                  ...bgLayerStyle(),
                }}
              />
              {/* 暗化遮罩 */}
              {effects.dim > 0 && (
                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `rgba(0,0,0,${effects.dim / 100})` }} />
              )}
              {/* 訊息捲動區 */}
              <div className="absolute inset-0 z-[2] overflow-y-auto p-4 space-y-2">
              {msgLoading ? (
                <div className="flex justify-center pt-10">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                  <div className="text-4xl">💬</div>
                  <p className="text-sm">開始對話吧</p>
                </div>
              ) : messages.map(msg => {
                const isRecalled = msg.content === '[已收回]'
                const isEditing = editingMsg?.id === msg.id
                const bodyContent = msg.content.includes('\n') ? msg.content.split('\n').slice(1).join('\n') : msg.content
                const hasReply = msg.content.startsWith('[reply:')
                const naked = !isEditing && isNakedContent(bodyContent)
                return (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} group/msgrow`}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {/* Hover quick actions — left side for mine, right side for others */}
                  {!isEditing && !isRecalled && hoveredMsgId === msg.id && (
                    <div className={`flex items-center gap-1 self-center mx-1.5 ${msg.isMine ? 'order-first' : 'order-last'}`}>
                      <button
                        onClick={() => setReplyTo(msg)}
                        title="回覆"
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                      >↩</button>
                      <button
                        onClick={() => { setForwardingMsg(msg); setMsgMenu(null) }}
                        title="轉傳"
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors text-sm"
                      >↪</button>
                      <button
                        onClick={e => openMenu(msg, e.clientX, e.clientY)}
                        title="更多"
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                      >⋯</button>
                    </div>
                  )}
                  <div
                    onPointerDown={e => !isEditing && startLongPress(e, msg)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerMove={cancelLongPress}
                    onContextMenu={e => !isEditing && handleContextMenu(e, msg)}
                    style={{
                      touchAction: 'pan-y',
                      ...(naked || isRecalled ? {} : msg.isMine ? {
                        background: activeTheme.myBg,
                        color: activeTheme.myText,
                        boxShadow: activeTheme.myShadow ?? 'none',
                      } : {
                        background: activeTheme.theirBg,
                        color: activeTheme.theirText,
                        border: activeTheme.theirBorder ?? 'none',
                      }),
                    }}
                    className={`max-w-[75%] rounded-2xl select-none cursor-default ${
                      naked ? 'overflow-hidden' :
                      isRecalled ? 'bg-white/[0.04] text-white/25 px-3.5 py-2.5' :
                      msg.isMine
                        ? 'rounded-br-[6px] px-3.5 py-2.5'
                        : 'rounded-bl-[6px] px-3.5 py-2.5'
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
                          className="w-full bg-transparent text-sm text-white resize-none outline-none min-w-[160px]"
                        />
                        <div className="flex gap-3 mt-1.5">
                          <button onClick={() => saveEdit(msg.id)} className="text-[11px] text-amber-300 hover:text-amber-100 transition-colors">儲存</button>
                          <button onClick={() => setEditingMsg(null)} className="text-[11px] text-white/40 hover:text-white/60 transition-colors">取消</button>
                        </div>
                      </div>
                    ) : (
                      <MessageContent content={isRecalled ? '[已收回]' : bodyContent} edited={!!msg.editedAt} isMine={msg.isMine} onLightbox={(url, type) => setLightbox({ url, type })} />
                    )}
                    {!isEditing && (
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${naked ? (msg.isMine ? 'text-white/30 justify-end px-1' : 'text-white/25 px-1') : msg.isMine ? 'text-white/50 justify-end' : 'text-white/35'}`}>
                        {msg.editedAt && <span className="opacity-60">已編輯</span>}
                        <span>{formatTime(msg.createdAt)}</span>
                      </p>
                    )}
                  </div>
                </div>
                )
              })}
              <div ref={bottomRef} />
              </div>{/* end scroll area */}
            </div>{/* end layered bg wrapper */}

            {/* 輸入層 — 固定在底部（媒體面板 + 回覆預覽 + 輸入欄） */}
            <div className="shrink-0">
            {/* 媒體面板 */}
            {mediaPanel && (
              <div className="border-t border-white/8 bg-slate-900/80">
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
                    <p className="text-[10px] text-white/20 col-span-3 mt-1 text-center">
                      圖片: JPG PNG WebP GIF · 影片: MP4 MOV WebM · 音訊: MP3 M4A AAC · 檔案: PDF ZIP (上限 50MB)
                    </p>
                  </div>
                )}

                {mediaPanel === 'gif' && (
                  <div className="p-3">
                    <GifPicker
                      onSelect={(url) => { sendContent(`[gif:${url}]`); setMediaPanel(null) }}
                      onClose={() => setMediaPanel(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 回覆預覽 */}
            {replyTo && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/8 border-t border-amber-500/15">
                <div className="flex-1 border-l-2 border-amber-400/60 pl-2.5">
                  <p className="text-[10px] font-semibold text-amber-400/80 mb-0.5">回覆</p>
                  <p className="text-xs text-white/50 truncate">{replyTo.content.slice(0, 50)}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-white/25 hover:text-white/50 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Upload error toast */}
            {uploadError && (
              <div className="px-3 py-2 bg-rose-500/15 border-t border-rose-500/20 flex items-center gap-2">
                <span className="text-xs text-rose-300 flex-1">{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="text-rose-400/60 hover:text-rose-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 輸入欄 */}
            <div className="px-3 pt-2.5 bg-slate-950/80 border-t border-white/[0.06]"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
            >
              {plusMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setPlusMenuOpen(false)} />}
              <div className="flex items-center gap-2">
                {/* + dropdown for emoji / attach / GIF */}
                <div className="relative z-20 shrink-0">
                  <button
                    onClick={() => { setPlusMenuOpen(p => !p); setMediaPanel(null) }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${plusMenuOpen ? 'bg-amber-500/30 text-amber-300' : 'bg-white/8 text-white/40 hover:bg-white/12 hover:text-white/70'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {plusMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 bg-slate-800/98 backdrop-blur-xl border border-white/12 rounded-2xl overflow-hidden shadow-2xl min-w-[145px]">
                      <button
                        onClick={() => { setMediaPanel(p => p === 'emoji' ? null : 'emoji'); setPlusMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 text-sm text-white/80 transition-colors"
                      >
                        <Smile className="w-4 h-4 text-yellow-400" /> 表情 / 貼圖
                      </button>
                      <button
                        onClick={() => { setMediaPanel(p => p === 'attach' ? null : 'attach'); setPlusMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 text-sm text-white/80 transition-colors border-t border-white/8"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Paperclip className="w-4 h-4 text-sky-400" />} 附件
                      </button>
                      <button
                        onClick={() => { setMediaPanel(p => p === 'gif' ? null : 'gif'); setPlusMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 text-sm text-white/80 transition-colors border-t border-white/8"
                      >
                        <Gift className="w-4 h-4 text-purple-400" /> GIF
                      </button>
                    </div>
                  )}
                </div>
                {/* Input pill */}
                <div className="flex-1 flex items-center bg-slate-800/80 border border-white/[0.08] rounded-3xl overflow-hidden focus-within:border-amber-500/40 transition-colors">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    onFocus={() => { setMediaPanel(null); setPlusMenuOpen(false) }}
                    placeholder="輸入訊息..."
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none min-w-0"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() || sending}
                    className={`shrink-0 w-8 h-8 rounded-full mr-1 flex items-center justify-center transition-all ${
                      input.trim() && !sending
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 scale-100'
                        : 'bg-white/8 text-white/25 scale-90'
                    }`}
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            </div>{/* end 輸入層 */}
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center text-white/15">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">選擇一個對話</p>
              <p className="text-xs mt-1 text-white/10">或前往別人的個人頁面發起對話</p>
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
            {msgMenu.msg.content !== '[已收回]' && (
              <button
                onClick={() => { setForwardingMsg(msgMenu.msg); setMsgMenu(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm text-white/80 text-left transition-colors border-t border-white/8"
              >
                <span>↪️</span> 轉傳
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

      {/* Lightbox */}
      {lightbox && <Lightbox url={lightbox.url} type={lightbox.type} onClose={() => setLightbox(null)} />}

      {/* Forward Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" onClick={() => setForwardingMsg(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <p className="font-semibold text-white text-sm">↪️ 轉傳訊息</p>
              <button onClick={() => setForwardingMsg(null)} className="text-white/40 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* preview */}
            <div className="mx-5 my-3 px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-xs text-white/40 truncate">
              {forwardingMsg.content.includes('\n')
                ? forwardingMsg.content.split('\n').slice(1).join('\n').slice(0, 60)
                : forwardingMsg.content.slice(0, 60)}
              {forwardingMsg.content.length > 60 && '…'}
            </div>
            <p className="text-xs text-white/30 px-5 mb-2">選擇要轉傳的對話：</p>
            <div className="max-h-64 overflow-y-auto pb-4">
              {conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => forwardMsgTo(conv.userId, conv.displayName)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center shrink-0 overflow-hidden text-sm font-bold text-white/80">
                    {conv.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : (conv.displayName ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{conv.displayName ?? '用戶'}</p>
                    {conv.lastMessagePreview && <p className="text-xs text-white/30 truncate">{conv.lastMessagePreview.slice(0, 30)}</p>}
                  </div>
                  {conv.userId === active?.userId && (
                    <span className="text-[10px] text-amber-400/60 shrink-0">目前對話</span>
                  )}
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-center text-sm text-white/30 py-6">沒有其他對話</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

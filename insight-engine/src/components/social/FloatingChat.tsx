'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MessageCircle, X, Send, ChevronRight } from 'lucide-react'

interface Conversation {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

// 這些路徑不顯示（已有完整 DM 介面）
const HIDDEN_PREFIXES = ['/messages', '/login', '/register', '/super-login', '/api', '/story/create', '/write']
const POS_KEY = 'floating_chat_pos'
const ENABLED_KEY = 'floating_chat_enabled'
const BTN = 48   // button size px
const DRAG_THRESHOLD = 6

// Constrain to 20%–80% of viewport height
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

export function FloatingChat() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<{ userId: string } | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unread, setUnread] = useState(0)
  const [quickTo, setQuickTo] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const didDrag = useRef(false)
  const dragOffset = useRef({ dx: 0, dy: 0 })

  const hidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p))

  // Init position + enabled state (client only)
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
        if (d?.conversations) setConversations(d.conversations.slice(0, 5))
      })
      .catch(() => {})
  }, [open, me])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuickTo(null)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const sendQuick = async () => {
    if (!input.trim() || !quickTo || sending) return
    setSending(true)
    await fetch('/api/admin/social/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: quickTo.userId, content: input.trim() }),
    }).catch(() => {})
    setInput('')
    setSending(false)
    setQuickTo(null)
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
      setQuickTo(null)
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

  // Panel opens to the left (or above if near right edge)
  const panelOnLeft = pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 40, touchAction: 'none' }}
    >
      {/* 展開面板 — absolute positioned relative to button */}
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
              <button onClick={() => { setOpen(false); setQuickTo(null) }} className="text-white/30 hover:text-white/60 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick reply input */}
          {quickTo && (
            <div className="px-3 py-2.5 bg-slate-800/60 border-b border-white/8">
              <div className="flex items-center gap-2 mb-2">
                <Avatar user={quickTo} size={5} />
                <p className="text-xs text-white/70 font-medium">{quickTo.displayName ?? '用戶'}</p>
                <button onClick={() => setQuickTo(null)} className="ml-auto text-white/25 hover:text-white/50">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendQuick() }}
                  placeholder="輸入訊息..."
                  className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-sky-500/50"
                />
                <button
                  onClick={sendQuick}
                  disabled={!input.trim() || sending}
                  className="p-1.5 bg-sky-500/30 hover:bg-sky-500/50 disabled:opacity-40 rounded-lg text-sky-300 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Conversation list */}
          <div className="max-h-64 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-white/25 text-xs py-6">還沒有對話</p>
            ) : conversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => setQuickTo(conv)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <Avatar user={conv} size={8} />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">{conv.displayName ?? '用戶'}</p>
                  <p className="text-[10px] text-white/35 truncate mt-0.5">{conv.lastMessagePreview}</p>
                </div>
                <span className="text-[9px] text-white/25 shrink-0">{formatTime(conv.lastMessageAt)}</span>
              </button>
            ))}
          </div>

          {/* Footer CTA */}
          <button
            onClick={() => { router.push('/messages'); setOpen(false) }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-white/8 text-xs text-sky-400/70 hover:text-sky-400 hover:bg-sky-900/20 transition-colors"
          >
            開啟訊息頁面 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating trigger button — draggable */}
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
  )
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

/** Call this to toggle the floating chat bubble visibility (for user settings) */
export function setFloatingChatEnabled(enabled: boolean) {
  try { localStorage.setItem(ENABLED_KEY, String(enabled)) } catch { /* ignore */ }
  // Dispatch event so the component re-checks
  window.dispatchEvent(new CustomEvent('floating-chat-toggle', { detail: enabled }))
}

export { ENABLED_KEY as FLOATING_CHAT_ENABLED_KEY }

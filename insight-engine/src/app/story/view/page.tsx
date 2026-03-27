'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { X, Eye, Heart, Send, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface PollState {
  votesA: number
  votesB: number
  total: number
  percentA: number
  percentB: number
  myChoice: 'a' | 'b' | null
}

interface Layer {
  id: string
  type: 'text' | 'emoji' | 'poll'
  content?: string
  font?: string
  color?: string
  size?: number
  effect?: string
  x: number
  y: number
  bold?: boolean
  italic?: boolean
  question?: string
  optionA?: string
  optionB?: string
  pollId?: string
}

interface CanvasData {
  bg: { type: 'gradient'; value: string }
  layers: Layer[]
}

interface Story {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  canvas: CanvasData
  expiresAt: string
  viewCount: number
  createdAt: string
  hasViewed: boolean
}

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function StoryViewInner() {
  const router = useRouter()
  const params = useSearchParams()
  const userId = params.get('userId')

  const [stories, setStories] = useState<Story[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [meId, setMeId] = useState<string | null>(null)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState<{ userId: string; name: string; avatar: string | null }[]>([])
  const [pollStates, setPollStates] = useState<Record<string, PollState>>({})
  const [replyInput, setReplyInput] = useState('')
  const [showReply, setShowReply] = useState(false)

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const DURATION = 5000

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then((d: { userId?: string } | null) => { if (d?.userId) setMeId(d.userId) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!userId) { router.back(); return }
    fetch(`/api/admin/social/stories?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { stories?: Story[] } | null) => { if (d?.stories) setStories(d.stories) })
      .finally(() => setLoading(false))
  }, [userId, router])

  const goNext = useCallback(() => {
    setCurrent(c => {
      if (c < stories.length - 1) return c + 1
      router.back()
      return c
    })
  }, [stories.length, router])

  const goPrev = useCallback(() => {
    setCurrent(c => Math.max(0, c - 1))
  }, [])

  useEffect(() => {
    if (stories.length === 0 || loading) return
    const story = stories[current]
    if (!story) return

    if (meId) {
      fetch('/api/admin/social/stories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id }),
      }).catch(() => {})
    }

    const pollLayers = story.canvas.layers.filter(l => l.type === 'poll' && l.pollId)
    pollLayers.forEach(pl => {
      if (pl.pollId && !pollStates[pl.pollId]) {
        fetch(`/api/admin/social/stories/poll?pollId=${pl.pollId}`)
          .then(r => r.ok ? r.json() : null)
          .then((d: PollState | null) => {
            if (d) setPollStates(prev => ({ ...prev, [pl.pollId!]: d }))
          }).catch(() => {})
      }
    })

    setProgress(0)
    if (progressRef.current) clearInterval(progressRef.current)

    if (!paused) {
      const tick = 50
      progressRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(progressRef.current!)
            goNext()
            return 0
          }
          return p + (tick / DURATION) * 100
        })
      }, tick)
    }

    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [current, stories, loading, paused, meId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerDown = () => {
    longPressRef.current = setTimeout(() => setPaused(true), 200)
  }
  const handlePointerUp = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
    setPaused(false)
  }

  const vote = async (pollId: string, choice: 'a' | 'b') => {
    await fetch('/api/admin/social/stories/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, choice }),
    }).catch(() => {})
    const d = await fetch(`/api/admin/social/stories/poll?pollId=${pollId}`)
      .then(r => r.ok ? r.json() : null) as PollState | null
    if (d) setPollStates(prev => ({ ...prev, [pollId]: d }))
  }

  const sendReply = async () => {
    if (!replyInput.trim() || !meId) return
    const story = stories[current]
    await fetch('/api/admin/social/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: story.userId, content: `💬 回覆限時動態：${replyInput.trim()}` }),
    }).catch(() => {})
    setReplyInput('')
    setShowReply(false)
  }

  const loadViewers = async (storyId: string) => {
    const d = await fetch(`/api/admin/social/stories/viewers?storyId=${storyId}`)
      .then(r => r.ok ? r.json() : null) as { viewers: { userId: string; name: string; avatar: string | null }[] } | null
    if (d) setViewers(d.viewers)
    setShowViewers(true)
  }

  const fontCls = (font?: string) => {
    if (font === 'classic') return 'font-serif'
    if (font === 'handwrite') return '[font-family:cursive]'
    if (font === 'typewriter') return 'font-mono'
    return 'font-sans'
  }

  const effectStyle = (effect?: string, color?: string): React.CSSProperties => {
    if (effect === 'neon') return { filter: `drop-shadow(0 0 8px ${color ?? '#fff'}) drop-shadow(0 0 20px ${color ?? '#fff'})` }
    if (effect === 'glow') return { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' }
    if (effect === 'shadow') return { filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))' }
    return {}
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  )

  if (stories.length === 0) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white/40">
      <p>沒有可播放的動態</p>
    </div>
  )

  const story = stories[current]
  const isOwner = meId === story.userId

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div
        className="relative w-full max-w-sm h-full max-h-[calc(100vh)] overflow-hidden"
        style={{ background: story.canvas.bg?.value ?? '#0f172a' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-[env(safe-area-inset-top,8px)]">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top,8px)+1.25rem)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
            {story.userAvatar
              ? <img src={story.userAvatar} alt="" className="w-full h-full object-cover" />
              : story.userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">{story.userName}</p>
            <p className="text-white/50 text-[10px]">{formatRelative(story.createdAt)}</p>
          </div>
          {isOwner && (
            <button onClick={() => loadViewers(story.id)} className="flex items-center gap-1 text-white/60 hover:text-white">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{story.viewCount}</span>
            </button>
          )}
          <button onClick={() => router.back()} className="p-1 text-white/60 hover:text-white ml-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layers */}
        {story.canvas.layers.map(layer => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: layer.type === 'poll' ? 'auto' : 'none',
          }

          if (layer.type === 'text') {
            return (
              <div key={layer.id} style={{
                ...style,
                color: layer.color ?? '#fff',
                fontSize: layer.size ?? 28,
                fontWeight: layer.bold ? 700 : 400,
                fontStyle: layer.italic ? 'italic' : 'normal',
                ...effectStyle(layer.effect, layer.color),
              }}
                className={`max-w-[80%] text-center whitespace-pre-wrap leading-tight px-2 ${fontCls(layer.font)}`}
              >
                {layer.content}
              </div>
            )
          }

          if (layer.type === 'emoji') {
            return (
              <div key={layer.id} style={{ ...style, fontSize: layer.size ?? 48 }}>
                {layer.content}
              </div>
            )
          }

          if (layer.type === 'poll' && layer.pollId) {
            const ps = pollStates[layer.pollId]
            return (
              <div key={layer.id} style={style} className="w-64 bg-black/50 backdrop-blur-md rounded-2xl p-3 pointer-events-auto">
                <p className="text-white text-sm font-semibold text-center mb-2">{layer.question}</p>
                {ps?.myChoice ? (
                  <div className="space-y-1.5">
                    {(['a', 'b'] as const).map(choice => (
                      <div key={choice} className="relative h-9 rounded-xl overflow-hidden bg-white/10">
                        <div
                          className="absolute inset-y-0 left-0 bg-amber-500/40 transition-all duration-700"
                          style={{ width: `${choice === 'a' ? ps.percentA : ps.percentB}%` }}
                        />
                        <div className="relative flex items-center justify-between px-3 h-full">
                          <span className="text-white text-xs font-medium">{choice === 'a' ? layer.optionA : layer.optionB}</span>
                          <span className="text-white/70 text-xs">{choice === 'a' ? ps.percentA : ps.percentB}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(['a', 'b'] as const).map(choice => (
                      <button
                        key={choice}
                        onClick={() => vote(layer.pollId!, choice)}
                        className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs text-center font-medium transition-colors"
                      >
                        {choice === 'a' ? layer.optionA : layer.optionB}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return null
        })}

        {/* Tap zones */}
        <button className="absolute left-0 top-0 w-1/3 h-full z-10" onClick={goPrev} />
        <button className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={goNext} />

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-2">
          {!isOwner && (
            <>
              {showReply ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendReply() }}
                    placeholder="傳送回覆..."
                    autoFocus
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                  <button onClick={sendReply} className="p-2 bg-amber-500/30 rounded-xl text-amber-300">
                    <Send className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowReply(false)} className="p-2 text-white/40">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowReply(true)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-sm text-white/50 text-left"
                  >
                    傳送回覆...
                  </button>
                  <button className="p-2 text-white/60 hover:text-rose-400 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Viewers drawer */}
      {showViewers && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end" onClick={() => setShowViewers(false)}>
          <div className="w-full bg-slate-900 rounded-t-3xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white/60">觀看者 ({viewers.length})</p>
              <button onClick={() => setShowViewers(false)} className="text-white/30">
                <X className="w-4 h-4" />
              </button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-center text-white/25 py-6 text-sm">還沒有人看過</p>
            ) : viewers.map(v => (
              <div key={v.userId} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white/70 overflow-hidden shrink-0">
                  {v.avatar ? <img src={v.avatar} alt="" className="w-full h-full object-cover" /> : v.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm text-white/80">{v.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page export: wraps inner component in Suspense ────────────────────────────

export default function StoryViewPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    }>
      <StoryViewInner />
    </Suspense>
  )
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 1) return `${Math.floor(diff / 60_000)} 分鐘前`
  if (hrs < 24) return `${hrs} 小時前`
  return `${Math.floor(hrs / 24)} 天前`
}

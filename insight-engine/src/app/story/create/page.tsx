'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Type, Smile, BarChart2, Music, Hash, Send, Loader2,
  ChevronDown, Bold, Italic
} from 'lucide-react'

// ── 背景漸層選項 ──────────────────────────────────────────
const BG_GRADIENTS = [
  { id: 'violet',  value: 'linear-gradient(135deg,#667eea,#764ba2)', label: '星紫' },
  { id: 'sunset',  value: 'linear-gradient(135deg,#f97316,#ec4899)', label: '晚霞' },
  { id: 'ocean',   value: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', label: '深海' },
  { id: 'forest',  value: 'linear-gradient(135deg,#16a34a,#0d9488)', label: '林道' },
  { id: 'aurora',  value: 'linear-gradient(135deg,#a78bfa,#34d399)', label: '極光' },
  { id: 'rose',    value: 'linear-gradient(135deg,#f43f5e,#fb923c)', label: '玫瑰' },
  { id: 'midnight',value: 'linear-gradient(135deg,#0f172a,#1e3a5f)', label: '深夜' },
  { id: 'gold',    value: 'linear-gradient(135deg,#f59e0b,#eab308)', label: '黃金' },
]

const FONT_STYLES = [
  { id: 'modern',     label: '現代', cls: 'font-sans' },
  { id: 'classic',    label: '古典', cls: 'font-serif' },
  { id: 'handwrite',  label: '手寫', cls: 'font-[cursive]' },
  { id: 'typewriter', label: '打字機', cls: 'font-mono' },
]

const TEXT_EFFECTS = [
  { id: 'none',   label: '無' },
  { id: 'neon',   label: '霓虹' },
  { id: 'glow',   label: '光暈' },
  { id: 'shadow', label: '陰影' },
]

const EMOJI_LIST = ['😊','❤️','🔥','✨','🌸','🎉','💫','🌙','⭐','🐾','🌊','🍃','💎','🎵','🌈','👑']

// ── 型別 ──────────────────────────────────────────────────
interface TextLayer {
  id: string
  type: 'text'
  content: string
  font: string
  color: string
  size: number
  effect: string
  x: number  // % of canvas width
  y: number  // % of canvas height
  bold: boolean
  italic: boolean
}

interface EmojiLayer {
  id: string
  type: 'emoji'
  content: string
  x: number
  y: number
  size: number
}

interface PollLayer {
  id: string
  type: 'poll'
  question: string
  optionA: string
  optionB: string
  x: number
  y: number
}

type Layer = TextLayer | EmojiLayer | PollLayer

interface CanvasData {
  bg: { type: 'gradient'; value: string }
  layers: Layer[]
  expiresHours: number
}

// ── Drag helper ───────────────────────────────────────────
function useDrag(onMove: (dx: number, dy: number) => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    startRef.current = { x: e.clientX, y: e.clientY }
    onMove(dx, dy)
  }, [onMove])

  const onPointerUp = useCallback(() => { startRef.current = null }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}

// ── Main Component ────────────────────────────────────────
export default function StoryCreatePage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [bg, setBg] = useState(BG_GRADIENTS[0])
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [expiresHours, setExpiresHours] = useState(24)
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public')
  const [publishing, setPublishing] = useState(false)

  // Panel states
  const [panel, setPanel] = useState<'bg' | 'text' | 'emoji' | 'poll' | 'music' | null>(null)

  // Text editor state
  const [textInput, setTextInput] = useState('')
  const [textFont, setTextFont] = useState('modern')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(28)
  const [textEffect, setTextEffect] = useState('none')
  const [textBold, setTextBold] = useState(false)
  const [textItalic, setTextItalic] = useState(false)

  // Poll editor state
  const [pollQ, setPollQ] = useState('')
  const [pollA, setPollA] = useState('')
  const [pollB, setPollB] = useState('')

  const genId = () => Math.random().toString(36).slice(2)

  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null

  // ── Layer actions ──────────────────────────────────────
  const addTextLayer = () => {
    if (!textInput.trim()) return
    const layer: TextLayer = {
      id: genId(), type: 'text',
      content: textInput.trim(), font: textFont,
      color: textColor, size: textSize,
      effect: textEffect, x: 50, y: 50,
      bold: textBold, italic: textItalic,
    }
    setLayers(prev => [...prev, layer])
    setActiveLayerId(layer.id)
    setTextInput('')
    setPanel(null)
  }

  const addEmojiLayer = (emoji: string) => {
    const layer: EmojiLayer = { id: genId(), type: 'emoji', content: emoji, x: 50, y: 50, size: 48 }
    setLayers(prev => [...prev, layer])
    setActiveLayerId(layer.id)
    setPanel(null)
  }

  const addPollLayer = () => {
    if (!pollQ.trim() || !pollA.trim() || !pollB.trim()) return
    const layer: PollLayer = { id: genId(), type: 'poll', question: pollQ, optionA: pollA, optionB: pollB, x: 50, y: 70 }
    setLayers(prev => [...prev, layer])
    setActiveLayerId(layer.id)
    setPollQ(''); setPollA(''); setPollB('')
    setPanel(null)
  }

  const deleteActiveLayer = () => {
    setLayers(prev => prev.filter(l => l.id !== activeLayerId))
    setActiveLayerId(null)
  }

  const moveLayer = useCallback((id: string, dx: number, dy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.getBoundingClientRect()
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l
      return {
        ...l,
        x: Math.max(5, Math.min(95, l.x + (dx / width) * 100)),
        y: Math.max(5, Math.min(95, l.y + (dy / height) * 100)),
      }
    }))
  }, [])

  // ── Publish ────────────────────────────────────────────
  const publish = async () => {
    if (layers.length === 0) {
      alert('請至少加入一個文字或貼圖')
      return
    }
    setPublishing(true)
    try {
      const canvas: CanvasData = {
        bg: { type: 'gradient', value: bg.value },
        layers,
        expiresHours,
      }
      const res = await fetch('/api/admin/social/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas, visibility, expiresHours }),
      })
      if (res.ok) {
        router.push('/articles')
      } else {
        alert('發布失敗，請重試')
      }
    } catch {
      alert('發布失敗，請重試')
    } finally {
      setPublishing(false)
    }
  }

  // ── Text effect class ──────────────────────────────────
  const effectCls = (effect: string) => {
    if (effect === 'neon') return 'drop-shadow-[0_0_8px_currentColor] drop-shadow-[0_0_20px_currentColor]'
    if (effect === 'glow') return 'drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
    if (effect === 'shadow') return 'drop-shadow-[2px_4px_6px_rgba(0,0,0,0.8)]'
    return ''
  }

  const fontCls = (font: string) => {
    if (font === 'classic') return 'font-serif'
    if (font === 'handwrite') return '[font-family:cursive]'
    if (font === 'typewriter') return 'font-mono'
    return 'font-sans'
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 z-20 shrink-0">
        <button onClick={() => router.back()} className="p-2 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-white/80">建立限時動態</span>
        <div className="flex items-center gap-2">
          {activeLayer && (
            <button
              onClick={deleteActiveLayer}
              className="px-3 py-1.5 rounded-xl bg-rose-500/30 text-rose-300 text-xs hover:bg-rose-500/50"
            >
              刪除
            </button>
          )}
          <button
            onClick={publish}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            發布
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div
          ref={canvasRef}
          className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: bg.value }}
          onClick={() => setActiveLayerId(null)}
        >
          {layers.map(layer => (
            <DraggableLayer
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
              onSelect={() => setActiveLayerId(layer.id)}
              onMove={(dx, dy) => moveLayer(layer.id, dx, dy)}
              fontCls={fontCls}
              effectCls={effectCls}
            />
          ))}

          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-white/30 text-sm">點下方工具列新增內容</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings bar ── */}
      <div className="flex items-center justify-between px-5 py-2 z-20 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setExpiresHours(h => h === 24 ? 72 : h === 72 ? 0 : 24)}
            className="px-2.5 py-1 rounded-lg bg-white/10 text-white/60 hover:text-white"
          >
            {expiresHours === 0 ? '永久' : `${expiresHours}h`}
          </button>
          <button
            onClick={() => setVisibility(v => v === 'public' ? 'followers' : 'public')}
            className="px-2.5 py-1 rounded-lg bg-white/10 text-white/60 hover:text-white"
          >
            {visibility === 'public' ? '公開' : '粉絲限定'}
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-around px-4 py-3 z-20 shrink-0 border-t border-white/10">
        {[
          { icon: <div className="w-5 h-5 rounded-full border-2 border-white/60" style={{ background: bg.value }} />, label: '背景', id: 'bg' as const },
          { icon: <Type className="w-5 h-5" />, label: '文字', id: 'text' as const },
          { icon: <Smile className="w-5 h-5" />, label: 'Emoji', id: 'emoji' as const },
          { icon: <BarChart2 className="w-5 h-5" />, label: '投票', id: 'poll' as const },
          { icon: <Music className="w-5 h-5" />, label: '音樂', id: 'music' as const },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setPanel(p => p === item.id ? null : item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${panel === item.id ? 'text-amber-400' : 'text-white/50 hover:text-white'}`}
          >
            {item.icon}
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Panels ── */}
      {panel && (
        <div className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 max-h-[55vh] overflow-y-auto">

          {/* Background panel */}
          {panel === 'bg' && (
            <div>
              <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">選擇背景</p>
              <div className="grid grid-cols-4 gap-2">
                {BG_GRADIENTS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setBg(g); setPanel(null) }}
                    className={`aspect-square rounded-2xl transition-all ${bg.id === g.id ? 'ring-2 ring-amber-400 scale-95' : 'hover:scale-95'}`}
                    style={{ background: g.value }}
                  >
                    <span className="text-[9px] text-white/80 font-medium block mt-auto">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text panel */}
          {panel === 'text' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">新增文字</p>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="輸入文字..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30 resize-none"
                autoFocus
              />
              {/* Font */}
              <div className="flex gap-2">
                {FONT_STYLES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTextFont(f.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs transition-colors ${textFont === f.id ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-white/50 hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Effect */}
              <div className="flex gap-2">
                {TEXT_EFFECTS.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setTextEffect(e.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs transition-colors ${textEffect === e.id ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30' : 'bg-white/5 text-white/50 hover:text-white'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {/* Color + Size + Bold/Italic */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">顏色</span>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">大小</span>
                  <input type="range" min={14} max={60} value={textSize} onChange={e => setTextSize(Number(e.target.value))}
                    className="w-20 accent-amber-400"
                  />
                  <span className="text-xs text-white/40">{textSize}</span>
                </div>
                <button onClick={() => setTextBold(b => !b)} className={`p-1.5 rounded-lg ${textBold ? 'bg-white/20 text-white' : 'text-white/40'}`}>
                  <Bold className="w-4 h-4" />
                </button>
                <button onClick={() => setTextItalic(b => !b)} className={`p-1.5 rounded-lg ${textItalic ? 'bg-white/20 text-white' : 'text-white/40'}`}>
                  <Italic className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={addTextLayer}
                disabled={!textInput.trim()}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
              >
                加入畫布
              </button>
            </div>
          )}

          {/* Emoji panel */}
          {panel === 'emoji' && (
            <div>
              <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">選擇 Emoji</p>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => addEmojiLayer(e)}
                    className="text-2xl hover:scale-110 transition-transform active:scale-95"
                  >{e}</button>
                ))}
              </div>
            </div>
          )}

          {/* Poll panel */}
          {panel === 'poll' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">新增投票</p>
              <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="投票問題..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30"
              />
              <div className="flex gap-2">
                <input value={pollA} onChange={e => setPollA(e.target.value)} placeholder="選項 A"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30"
                />
                <input value={pollB} onChange={e => setPollB(e.target.value)} placeholder="選項 B"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/30"
                />
              </div>
              <button
                onClick={addPollLayer}
                disabled={!pollQ.trim() || !pollA.trim() || !pollB.trim()}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
              >
                加入投票
              </button>
            </div>
          )}

          {/* Music panel (placeholder) */}
          {panel === 'music' && (
            <div className="text-center py-8 text-white/30">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">音樂功能即將推出</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Draggable Layer Component ────────────────────────────
interface DraggableLayerProps {
  layer: Layer
  isActive: boolean
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  fontCls: (font: string) => string
  effectCls: (effect: string) => string
}

function DraggableLayer({ layer, isActive, onSelect, onMove, fontCls, effectCls }: DraggableLayerProps) {
  const drag = useDrag(onMove)

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: 'translate(-50%, -50%)',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  }

  const border = isActive ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-transparent rounded-lg' : ''

  if (layer.type === 'text') {
    const tl = layer as TextLayer
    return (
      <div
        style={{ ...baseStyle, color: tl.color, fontSize: tl.size, fontWeight: tl.bold ? 700 : 400, fontStyle: tl.italic ? 'italic' : 'normal' }}
        className={`max-w-[80%] text-center whitespace-pre-wrap leading-tight px-2 py-1 ${fontCls(tl.font)} ${effectCls(tl.effect)} ${border}`}
        onClick={e => { e.stopPropagation(); onSelect() }}
        {...drag}
      >
        {tl.content}
      </div>
    )
  }

  if (layer.type === 'emoji') {
    const el = layer as EmojiLayer
    return (
      <div
        style={{ ...baseStyle, fontSize: el.size }}
        className={`${border}`}
        onClick={e => { e.stopPropagation(); onSelect() }}
        {...drag}
      >
        {el.content}
      </div>
    )
  }

  if (layer.type === 'poll') {
    const pl = layer as PollLayer
    return (
      <div
        style={baseStyle}
        className={`w-64 bg-black/40 backdrop-blur-sm rounded-2xl p-3 ${border}`}
        onClick={e => { e.stopPropagation(); onSelect() }}
        {...drag}
      >
        <p className="text-white text-sm font-semibold text-center mb-2">{pl.question || '投票問題'}</p>
        <div className="flex gap-2">
          <div className="flex-1 py-2 bg-white/20 rounded-xl text-white text-xs text-center font-medium">{pl.optionA || 'A'}</div>
          <div className="flex-1 py-2 bg-white/20 rounded-xl text-white text-xs text-center font-medium">{pl.optionB || 'B'}</div>
        </div>
      </div>
    )
  }

  return null
}

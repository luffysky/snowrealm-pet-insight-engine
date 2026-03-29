'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { YukirinControls, YukirinMood } from './YukirinScene'

const YukirinScene = dynamic(() => import('./YukirinScene'), { ssr: false })
const YukirinOrbitModal = dynamic(() => import('./YukirinOrbitModal'), { ssr: false })
const YukirinChatPanel = dynamic(() => import('./YukirinChatPanel'), { ssr: false })

// ── 隨機台詞 ───────────────────────────────────────────────────────────────
type Line = { text: string; mood: YukirinMood }

const LINES: Line[] = [
  { text: '嗨嗨！今天也要加油唷 ✨', mood: 'happy' },
  { text: '有什麼我可以幫你的嗎？', mood: 'wink' },
  { text: '點擊我可以跟我互動喔！', mood: 'excited' },
  { text: '填問卷可以賺 Z 幣哦～', mood: 'happy' },
  { text: '探索頁面有很多有趣的人！', mood: 'excited' },
  { text: '記得簽到領今日獎勵！', mood: 'wink' },
  { text: '我最近學了好多新東西 💫', mood: 'relaxed' },
  { text: '你知道你可以建立自己的問卷嗎？', mood: 'surprised' },
  { text: '今天天氣好適合分享心情 🌸', mood: 'happy' },
  { text: '看起來你很忙，我靜靜陪著你 🌙', mood: 'relaxed' },
  { text: '有煩惱嗎？說出來讓我聽聽～', mood: 'relaxed' },
  { text: '嗯...我在想要說什麼好 🤔', mood: 'thinking' },
  { text: '要不要去看看大家的故事？', mood: 'happy' },
  { text: '你的問卷有新回覆了！快去看看 📊', mood: 'excited' },
  { text: '今天也謝謝你來找我 💜', mood: 'happy' },
  { text: '不要一直工作，休息一下也很重要喔', mood: 'relaxed' },
  { text: '哇你點了我！嘻嘻 😊', mood: 'surprised' },
]

function getTimedLine(): Line {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9)   return { text: '早安！今天也要元氣滿滿 ☀️', mood: 'excited' }
  if (hour >= 22 || hour < 1)  return { text: '這麼晚了，要早點休息喔 🌙', mood: 'relaxed' }
  if (hour >= 12 && hour < 14) return { text: '午休時間，要吃飯了嗎？ 🍱', mood: 'happy' }
  return LINES[Math.floor(Math.random() * LINES.length)]
}

// ── 氣泡元件 ──────────────────────────────────────────────────────────────
function SpeechBubble({
  text, visible, onClose, actions,
}: {
  text: string
  visible: boolean
  onClose: () => void
  actions?: { label: string; onClick: () => void }[]
}) {
  return (
    <div
      className={`absolute bottom-[calc(100%+8px)] right-0 w-56 transition-all duration-300 pointer-events-auto ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="relative bg-white/90 backdrop-blur-xl border border-[#b8a9e8]/40 rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-[0_8px_24px_rgba(184,169,232,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[#b5a8d0] hover:text-[#6b5fa8] hover:bg-[#b8a9e8]/15 transition-colors text-[10px] leading-none"
        >
          ✕
        </button>
        <p className="text-xs text-[#3d3155] leading-relaxed pr-3">{text}</p>
        {actions && actions.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {actions.map(a => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#b8a9e8]/20 border border-[#b8a9e8]/40 text-[#5a4878] hover:bg-[#b8a9e8]/35 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* 三角形尾巴（右下角） */}
      <div className="absolute -bottom-[6px] right-5 w-3 h-3 bg-white/90 border-r border-b border-[#b8a9e8]/40 rotate-45" />
    </div>
  )
}

// ── 效能圖示 ──────────────────────────────────────────────────────────────
function QualityIcon({ isLow }: { isLow: boolean }) {
  return isLow ? (
    // 省電：葉子形
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M5 1C2.5 1 1 3 1 5.5c0 1.5.7 2.8 1.8 3.5C4 7.5 5 6 5 6s1 1.5 2.2 3c1.1-.7 1.8-2 1.8-3.5C9 3 7.5 1 5 1z"/>
    </svg>
  ) : (
    // 高效能：閃電
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M6 1L2 6h3.5L4 9l4-5H4.5L6 1z"/>
    </svg>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────
export default function YukirinWidget() {
  const [open, setOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [orbitOpen, setOrbitOpen] = useState(false)
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const [currentLine, setCurrentLine] = useState<Line>(LINES[0])
  const [bubbleActions, setBubbleActions] = useState<{ label: string; onClick: () => void }[] | undefined>()
  const yukirinRef = useRef<YukirinControls | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 效能設定 ──────────────────────────────────────────────────────────────
  const [performanceMode, setPerformanceModeState] = useState<'high' | 'low'>(() => {
    if (typeof window === 'undefined') return 'high'
    return (localStorage.getItem('yukirin-quality') as 'high' | 'low') ?? 'high'
  })

  const setPerformanceMode = useCallback((mode: 'high' | 'low') => {
    setPerformanceModeState(mode)
    localStorage.setItem('yukirin-quality', mode)
  }, [])

  const togglePerformance = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDraggingRef.current) return
    setPerformanceMode(performanceMode === 'high' ? 'low' : 'high')
  }, [performanceMode, setPerformanceMode])

  const handleLowPerformance = useCallback(() => {
    // 雪凜主動關心，語氣委婉
    setCurrentLine({
      text: '欸嘿...感覺你的裝置好像有點喘 🥺 要不要讓我切換到省電模式？這樣我就不會佔用太多資源了～',
      mood: 'relaxed',
    })
    setBubbleActions([
      {
        label: '好啊，切換吧',
        onClick: () => {
          setPerformanceMode('low')
          setBubbleVisible(false)
          setBubbleActions(undefined)
        },
      },
      {
        label: '沒關係',
        onClick: () => {
          setBubbleVisible(false)
          setBubbleActions(undefined)
        },
      },
    ])
    setBubbleVisible(true)
    yukirinRef.current?.setMood('relaxed', 400)
  }, [setPerformanceMode])

  // ── 拖曳移動（document-level listener，不依賴 setPointerCapture） ─────────
  const [widgetPos, setWidgetPos] = useState<{ x: number; y: number } | null>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const isDraggingRef = useRef(false)

  const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const startPx = e.clientX, startPy = e.clientY
    const startWx = rect.left,  startWy = rect.top
    const el = e.currentTarget as HTMLElement
    const pid = e.pointerId
    isDraggingRef.current = false

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      const dx = ev.clientX - startPx
      const dy = ev.clientY - startPy
      if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDraggingRef.current = true
        setIsGrabbing(true)
      }
      if (!isDraggingRef.current) return
      ev.preventDefault() // 阻止 iOS 滾動
      const newX = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  startWx + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startWy + dy))
      setWidgetPos({ x: newX, y: newY })
    }

    const handleUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup',   handleUp)
      setIsGrabbing(false)
      setTimeout(() => { isDraggingRef.current = false }, 50)
    }

    // passive: false 讓 iOS 允許 preventDefault
    document.addEventListener('pointermove', handleMove, { passive: false })
    document.addEventListener('pointerup',   handleUp)
  }, [])

  // ── 說話邏輯 ─────────────────────────────────────────────────────────────
  const handleLoad = useCallback((controls: YukirinControls) => {
    yukirinRef.current = controls
  }, [])

  const showBubble = useCallback(() => {
    const line = getTimedLine()
    setCurrentLine(line)
    setBubbleActions(undefined)
    setBubbleVisible(true)
    yukirinRef.current?.setMood(line.mood, 400)
    bubbleTimerRef.current = setTimeout(() => {
      setBubbleVisible(false)
      setTimeout(() => yukirinRef.current?.setMood('happy', 600), 800)
    }, 6000)
  }, [])

  useEffect(() => {
    if (!open) {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      setBubbleVisible(false)
      return
    }
    const first = setTimeout(() => showBubble(), 2000)
    const schedule = () => {
      const delay = 20000 + Math.random() * 20000
      bubbleTimerRef.current = setTimeout(() => {
        showBubble()
        schedule()
      }, delay)
    }
    const afterFirst = setTimeout(() => schedule(), 9000)

    return () => {
      clearTimeout(first)
      clearTimeout(afterFirst)
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [open, showBubble])

  const handleClick = useCallback(() => {
    if (isDraggingRef.current) return
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    showBubble()
  }, [showBubble])

  const handleOpen = useCallback(() => {
    if (isDraggingRef.current) return
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    if (isDraggingRef.current) return
    setOpen(false)
    setChatOpen(false)
  }, [])

  return (
    <div
      className={`fixed z-40 select-none touch-none ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={
        widgetPos
          ? { left: widgetPos.x, top: widgetPos.y }
          : { bottom: 'calc(var(--bnav-h, 76px) + 12px)', right: '12px' }
      }
      onPointerDown={onDragStart}
    >
      {open ? (
        <div className="relative flex flex-col items-end">

          {/* ── Chat Panel 模式 ─────────────────────────── */}
          {chatOpen ? (
            <YukirinChatPanel onClose={() => setChatOpen(false)} />
          ) : (
            <>
              {/* 氣泡 */}
              <SpeechBubble
                text={currentLine.text}
                visible={bubbleVisible}
                onClose={() => { setBubbleVisible(false); setBubbleActions(undefined) }}
                actions={bubbleActions}
              />

              {/* 雪凜 3D 視窗 */}
              <div className="relative w-24 h-28 sm:w-28 sm:h-32">
                {/* 關閉按鈕（左上） */}
                <button
                  onClick={handleClose}
                  className="absolute -top-2 -left-2 z-10 w-5 h-5 rounded-full bg-white/80 border border-[#b8a9e8]/40 flex items-center justify-center text-[10px] text-[#8a7ca8] hover:text-[#3d3155] shadow-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
                {/* 效能切換按鈕（右上） */}
                <button
                  onClick={togglePerformance}
                  className={`absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white/80 border border-[#b8a9e8]/40 flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
                    performanceMode === 'low'
                      ? 'text-emerald-500 hover:text-emerald-700'
                      : 'text-[#8a7ca8] hover:text-[#3d3155]'
                  }`}
                  title={performanceMode === 'high' ? '切換到省電模式' : '切換到高效能模式'}
                >
                  <QualityIcon isLow={performanceMode === 'low'} />
                </button>
                {/* 展開 360° 按鈕 */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isDraggingRef.current) setOrbitOpen(true) }}
                  className="absolute -bottom-2 -right-2 z-10 w-5 h-5 rounded-full bg-white/80 border border-[#b8a9e8]/40 flex items-center justify-center text-[#8a7ca8] hover:text-[#3d3155] shadow-sm transition-colors cursor-pointer"
                  title="360° 旋轉視角"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M0 0h3.5v1.5H1.5v2H0V0zm6.5 0H10v3.5H8.5v-2h-2V0zM0 6.5h1.5v2h2V10H0V6.5zM8.5 8.5v-2H10V10H6.5V8.5h2z"/>
                  </svg>
                </button>
                {/* 開啟對話按鈕（左下） */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isDraggingRef.current) setChatOpen(true) }}
                  className="absolute -bottom-2 -left-2 z-10 w-5 h-5 rounded-full bg-white/80 border border-[#b8a9e8]/40 flex items-center justify-center text-[#8a7ca8] hover:text-[#3d3155] shadow-sm transition-colors cursor-pointer"
                  title="跟雪凜說話"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1h8a1 1 0 011 1v5a1 1 0 01-1 1H3L1 10V2a1 1 0 011-1z"/>
                  </svg>
                </button>

                {/* 可點擊觸發說話 */}
                <button
                  onClick={handleClick}
                  className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#f3eeff] to-[#ffeef5] border border-[#b8a9e8]/30 shadow-[0_8px_32px_rgba(184,169,232,0.35)] cursor-pointer"
                  title="點我說話"
                >
                  <YukirinScene
                    cameraMode="upperBody"
                    mood="happy"
                    showBackground={false}
                    quality={performanceMode}
                    onLowPerformance={handleLowPerformance}
                    onLoad={handleLoad}
                    className="w-full h-full"
                  />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 收合狀態：迷你圓形按鈕 */
        <button
          onClick={handleOpen}
          className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#b8a9e8]/80 to-[#f5b8b5]/80 border-2 border-white/60 shadow-[0_4px_16px_rgba(184,169,232,0.5)] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          title="找雪凜聊天"
        >
          <span className="flex items-center justify-center w-full h-full text-xl">🌸</span>
        </button>
      )}

      {/* 360° Orbit Modal */}
      {orbitOpen && (
        <YukirinOrbitModal onClose={() => setOrbitOpen(false)} />
      )}
    </div>
  )
}

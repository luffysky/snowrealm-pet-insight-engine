'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { YukirinControls, YukirinMood } from './YukirinScene'
import type { GuideAction, GuideMessage } from '@/lib/guideEngine'
import { getFallbackResponse } from '@/lib/guideFallbacks'

// 兩個角色的共同操作介面（mood 接受 string 避免型別衝突）
type AnySceneControls = {
  setMood: (mood: string, durationMs?: number) => void
  playAnimation: (name: string) => void
  getCurrentAnimation?: () => string
  getCurrentMood?: () => string
}
import {
  handleSlashCommand,
  isSlashCommand,
  getCommandSuggestions,
  type SlashCommand,
} from '@/lib/agent/slashCommands'
import type { UserState } from '@/lib/agent/ruleEngine'

const YukirinScene = dynamic(() => import('./YukirinScene'), { ssr: false })
const RikuScene    = dynamic(() => import('./RikuScene'),    { ssr: false })  // 凜空場景

const DEFAULT_QUICK_REPLIES = ['帶我逛逛', '功能怎麼用', '找我聊天']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  mood?: YukirinMood
  /** 圖片預覽（base64 data URL） */
  imagePreview?: string
  /** 情侶插話：顯示為不同顏色的對話泡泡 */
  isPartner?: boolean
  partnerName?: string
}

interface TurnsInfo {
  isUnlimited: boolean
  freeRemaining: number | null
  purchasedCredits: number | null
  zcoinBalance: number | null
  isLoggedIn?: boolean
  isAdmin?: boolean
  isOwner?: boolean
  userName?: string | null
}

interface YukirinChatPanelProps {
  onClose: () => void
  character?: 'yukirin' | 'riku'
  onSwitchCharacter?: (char: 'yukirin' | 'riku') => void
  onPresenceModeChange?: (mode: 'mini' | 'chat' | 'companion' | 'free') => void
}

// ── 購買次數面板 ──────────────────────────────────────────────────────────────
function BuyTurnsPanel({
  zcoinBalance,
  isLoggedIn,
  onBought,
  onClose,
}: {
  zcoinBalance: number | null
  isLoggedIn: boolean
  onBought: (addedTurns: number, newBalance: number, totalCredits: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const packs: { key: 's' | 'm' | 'l'; zcoins: number; turns: number; label: string; badge?: string }[] = [
    { key: 's', zcoins: 5,  turns: 20,  label: '20 次' },
    { key: 'm', zcoins: 10, turns: 50,  label: '50 次' },
    { key: 'l', zcoins: 20, turns: 120, label: '120 次', badge: '最划算' },
  ]

  const handleBuy = async (pack: 's' | 'm' | 'l') => {
    if (!isLoggedIn) { setError('請先登入帳號才能購買～'); return }
    setLoading(pack)
    setError('')
    try {
      const res = await fetch('/api/guide/buy-turns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '購買失敗，請稍後再試'); return }
      onBought(data.addedTurns, data.newZcoinBalance, data.totalCredits)
    } catch {
      setError('網路錯誤，請再試一次')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="px-3 pb-3 pt-2 border-t border-white/8"
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/70">💬 今日免費次數已用完</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs">略過</button>
      </div>
      <p className="text-[10px] text-white/40 mb-2.5">
        用 Z幣 換更多對話次數吧～
        {zcoinBalance !== null && <span className="text-[#b8a9e8] ml-1">（你有 {zcoinBalance} Z幣）</span>}
      </p>

      {!isLoggedIn && (
        <p className="text-[10px] text-amber-400 mb-2">⚠️ 請先登入才能使用 Z幣</p>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {packs.map(p => {
          const canAfford = zcoinBalance !== null && zcoinBalance >= p.zcoins
          return (
            <button
              key={p.key}
              onClick={() => handleBuy(p.key)}
              disabled={!!loading || !isLoggedIn || !canAfford}
              className="relative flex-1 min-w-0 py-2 px-1.5 rounded-xl border text-center transition-all disabled:opacity-40"
              style={{
                background: canAfford && isLoggedIn ? 'rgba(184,169,232,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: canAfford && isLoggedIn ? 'rgba(184,169,232,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {p.badge && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-[#b8a9e8] text-black rounded-full px-1.5 py-0 font-bold whitespace-nowrap">
                  {p.badge}
                </span>
              )}
              <div className="text-[11px] font-bold text-white/80 mt-0.5">
                {loading === p.key ? '...' : p.label}
              </div>
              <div className="text-[9px] text-[#b8a9e8] mt-0.5">{p.zcoins} Z幣</div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}

const MAX_MESSAGES = 100

/** 加入新訊息，超過 MAX_MESSAGES 時循環覆蓋最舊的（保留第 0 筆初始問候） */
function appendMessage(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (prev.length >= MAX_MESSAGES) {
    return [...prev.slice(1), msg]
  }
  return [...prev, msg]
}

async function saveMessages(msgs: ChatMessage[]) {
  const filtered = msgs.filter(m => !m.isPartner)
  if (filtered.length === 0) return
  try {
    await fetch('/api/guide/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: filtered.map(m => ({ role: m.role, text: m.text, mood: m.mood })) }),
    })
  } catch { /* non-critical */ }
}

// ── 主元件 ───────────────────────────────────────────────────────────────────
export default function YukirinChatPanel({ onClose, character = 'yukirin', onSwitchCharacter, onPresenceModeChange }: YukirinChatPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const yukirinRef = useRef<AnySceneControls | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 情侶互動 session 狀態（不需要重渲染，用 ref）
  const coupleCountRef = useRef(0)
  const lastCoupleAtRef = useRef(0)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: '嗨嗨！我是雪凜～ 有什麼我可以幫你的嗎？',
      mood: 'happy',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES)

  // 次數狀態
  const [turnsInfo, setTurnsInfo] = useState<TurnsInfo | null>(null)
  const [showBuyPanel, setShowBuyPanel] = useState(false)

  // 斜線指令自動完成
  const [cmdSuggestions, setCmdSuggestions] = useState<SlashCommand[]>([])

  // 部落格創作模式
  const [blogWriteMode, setBlogWriteMode] = useState(false)
  const [blogWriting, setBlogWriting] = useState(false)

  // 角色顯示模式
  const [presenceMode, setPresenceMode] = useState<'mini' | 'chat' | 'companion' | 'free'>('chat')
  const [characterSize, setCharacterSize] = useState(1.0)
  // ref 解決 useCallback stale closure 問題
  const blogWriteModeRef = useRef(false)

  // 圖片上傳 & 語音輸入
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // 同步 blogWriteMode 到 ref（解決 useCallback stale closure）
  useEffect(() => {
    blogWriteModeRef.current = blogWriteMode
  }, [blogWriteMode])

  // 捲到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // 開啟時查詢剩餘次數 + 載入歷史（依序執行避免 race condition）
  useEffect(() => {
    let cancelled = false

    async function init() {
      // Step 1: 查詢身份 + 次數
      let turns: TurnsInfo | null = null
      try {
        const r = await fetch('/api/guide/turns')
        turns = await r.json() as TurnsInfo
        if (!cancelled) setTurnsInfo(turns)
      } catch { /* skip */ }

      // Step 2: 載入對話歷史
      let hasHistory = false
      try {
        const r = await fetch('/api/guide/history')
        const data = await r.json() as { messages: ChatMessage[] }
        if (!cancelled && data.messages && data.messages.length > 0) {
          setMessages(data.messages)
          hasHistory = true
        }
      } catch { /* skip */ }

      // Step 3: 問候語 — 永遠追加在最後面（最新訊息），像真人打招呼
      if (!cancelled && turns && (turns.isLoggedIn || turns.isUnlimited)) {
        const name = turns.userName
        let greeting: string
        if (turns.isOwner) {
          greeting = `${name ? `嗨嗨，${name}！` : '嗨嗨，老闆！'} 歡迎回來 ✨ 有什麼需要我幫你的嗎？`
        } else if (turns.isAdmin) {
          greeting = `嗨嗨${name ? `，${name}` : ''}！ 歡迎回到後台 🌸 有什麼我可以幫你的嗎？`
        } else {
          greeting = `嗨嗨${name ? `，${name}` : ''}！ 很高興再次見到你 💜 有什麼我可以幫你的嗎？`
        }

        setMessages(prev => {
          if (!hasHistory && prev.length === 1 && prev[0].id === '0') {
            // 沒有歷史 → 直接替換初始訊息
            return [{ ...prev[0], text: greeting }]
          }
          // 有歷史 → 在最後面追加問候語（像真人打開聊天室先跟你打招呼）
          return [...prev, { id: `greeting-${Date.now()}`, role: 'assistant' as const, text: greeting, mood: 'happy' as const }]
        })
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  const handleLoad = useCallback((controls: AnySceneControls) => {
    yukirinRef.current = controls
  }, [])

  const executeAction = useCallback((action: GuideAction) => {
    switch (action.type) {
      case 'navigate':
        router.push(action.target)
        break
      case 'navigate_admin': {
        // 從 pathname 提取租戶 slug 再組合後台路徑
        const m = pathname?.match(/^\/insight-admin\/([^/]+)/)
        const slug = m?.[1]
        const tgt = action.target ? `/${action.target}` : ''
        router.push(slug ? `/insight-admin/${slug}${tgt}` : `/insight-admin${tgt}`)
        break
      }
      case 'scroll': {
        const el = document.querySelector(action.target)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
      case 'highlight': {
        const el = document.querySelector(action.target) as HTMLElement | null
        if (el) {
          el.style.transition = 'box-shadow 0.3s'
          el.style.boxShadow = '0 0 0 3px rgba(184,169,232,0.8)'
          setTimeout(() => { el.style.boxShadow = '' }, 2500)
        }
        break
      }
      case 'show_survey':
        router.push(`/survey/${action.surveyId}`)
        break
    }
  }, [router, pathname])

  /** 組合一個最小 UserState 供斜線指令使用 */
  const buildSlashState = useCallback((): UserState => ({
    userId: '', nickname: '', isAdmin: turnsInfo?.isAdmin ?? false, isOwner: turnsInfo?.isOwner ?? false,
    selectedCharacter: character ?? 'yukirin',
    presenceMode, characterSize,
    currentPage: pathname ?? '/',
    timeOnPage: 0, scrollPosition: 0, scrollSpeed: 'idle',
    isTyping: true, lastClickTarget: '', pageVisitCount: 1,
    currentSurveyId: null, currentQuestionIndex: 0, totalQuestions: 0,
    isGuideOpen: true, currentSessionRounds: messages.length,
    visitCount: 0, surveysCompleted: 0,
    zcoinBalance: turnsInfo?.zcoinBalance ?? 0,
    streakDays: 0, daysSinceLastVisit: 0,
    currentHour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    isWeekend: [0, 6].includes(new Date().getDay()),
  }), [pathname, messages.length, turnsInfo, presenceMode, characterSize])

  // ── 圖片選擇處理 ─────────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage({ file, preview: reader.result as string })
    }
    reader.readAsDataURL(file)
    // 清空 input 讓同一張圖片可再選
    e.target.value = ''
  }, [])

  // 送出圖片分析
  const handleSendImage = useCallback(async () => {
    if (!uploadedImage || isAnalyzing) return
    setIsAnalyzing(true)

    // 加入使用者的圖片泡泡
    const imgMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim() ? input : '（傳送圖片）',
      imagePreview: uploadedImage.preview,
    }
    setMessages(prev => appendMessage(prev, imgMsg))
    setInput('')
    setUploadedImage(null)

    // 思考中動畫
    yukirinRef.current?.setMood('thinking', 300)
    yukirinRef.current?.playAnimation('think')

    try {
      const fd = new FormData()
      fd.append('image', uploadedImage.file)
      fd.append('character', character ?? 'yukirin')
      if (imgMsg.text !== '（傳送圖片）') fd.append('question', imgMsg.text)

      const res = await fetch('/api/guide/analyze-image', { method: 'POST', body: fd })
      const data = await res.json() as { text?: string; error?: string; newBalance?: number; cost?: number }

      if (!res.ok) {
        const errText = res.status === 401
          ? (character === 'riku' ? '...請先登入。' : '欸等等，你要先登入才能傳圖片喔！')
          : res.status === 402
          ? (character === 'riku' ? `...Z幣不足，需要 ${data.cost ?? 20} 個。` : `哎呀，Z幣不夠啦 QQ 圖片分析需要 ${data.cost ?? 20} Z幣～`)
          : (data.error ?? '分析失敗了...')
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(), role: 'assistant', text: errText, mood: 'sad',
        }))
        return
      }

      yukirinRef.current?.setMood('happy', 300)
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', text: data.text ?? '...', mood: 'happy',
      }))

      // 更新 Z幣 餘額顯示
      if (data.newBalance !== undefined && data.newBalance !== null) {
        setTurnsInfo(prev => prev ? { ...prev, zcoinBalance: data.newBalance! } : null)
      }
    } catch {
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', text: '哎呀網路問題 QQ 圖片沒送到', mood: 'sad',
      }))
    } finally {
      setIsAnalyzing(false)
    }
  }, [uploadedImage, isAnalyzing, input, character])

  // ── 語音輸入 ─────────────────────────────────────────────────────────────────
  const toggleVoiceInput = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SpeechRecognitionAPI = typeof window !== 'undefined' && (win.SpeechRecognition || win.webkitSpeechRecognition)

    if (!SpeechRecognitionAPI) {
      setMessages(prev => appendMessage(prev, {
        id: Date.now().toString(), role: 'assistant',
        text: character === 'riku' ? '...這個瀏覽器不支援語音。' : '欸，你的瀏覽器不支援語音輸入耶 QQ 換個瀏覽器試試？',
        mood: 'sad',
      }))
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any
    recognition.lang = 'zh-TW'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) setInput((prev: string) => prev + transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [isRecording, character])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => appendMessage(prev, userMsg))
    setInput('')
    setCmdSuggestions([])
    // 清空後重置 textarea 高度並 focus
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.focus()
      }
    })

    // ── 部落格創作模式：攔截使用者輸入，呼叫 AI write API ─────────────────
    if (blogWriteModeRef.current && !isSlashCommand(text)) {
      setBlogWriting(true)
      setIsLoading(true)

      // 確認 Z幣餘額
      const balance = turnsInfo?.zcoinBalance ?? 0
      if (balance < 200 && !turnsInfo?.isUnlimited) {
        const notEnough = character === 'riku'
          ? `...Z幣不夠。你有 ${balance} Z幣，需要 200 Z幣。去商城補一下吧。`
          : `哎呀！你的 Z幣只剩 ${balance} 個，需要 200 Z幣才能創作文章～ 去商城補一些吧！`
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: notEnough,
          mood: 'sad',
        }))
        setBlogWriteMode(false)
        setBlogWriting(false)
        setIsLoading(false)
        setQuickReplies([...DEFAULT_QUICK_REPLIES])
        return
      }

      const thinkingMsgs = character === 'riku' ? [
        '...在查資料。稍等。',
        '...先蒐集素材。',
      ] : [
        '好的！我先查一下相關資料，再開始寫～✨',
        '嗯嗯！讓我先找找素材，文章會更有深度！',
        '交給我！先查資料，再動筆～',
      ]
      const thinking = thinkingMsgs[Math.floor(Math.random() * thinkingMsgs.length)]
      yukirinRef.current?.setMood('thinking', 300)
      yukirinRef.current?.playAnimation('think')
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: thinking,
        mood: 'thinking',
      }))

      try {
        // Step 1: 先做研究
        let researchContext = ''
        try {
          const researchRes = await fetch('/api/blogs/ai-write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, mode: 'research' }),
          })
          if (researchRes.ok) {
            const researchData = await researchRes.json() as { content?: string; title?: string }
            if (researchData.content) {
              const plain = researchData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
              researchContext = plain
              const researchMsg = character === 'riku'
                ? `...素材整理好了。開始寫文章。`
                : `資料查好了！✨ 我找到一些不錯的素材，現在開始動筆～`
              setMessages(prev => appendMessage(prev, {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                text: researchMsg,
                mood: 'thinking',
              }))
            }
          }
        } catch {
          // 研究失敗不影響寫作
        }

        // Step 2: 正式寫作
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          text: character === 'riku' ? '...正在寫文章中。' : '（正在創作，請稍候...）',
          mood: 'thinking',
        }))

        const res = await fetch('/api/blogs/ai-write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, mode: 'full', researchContext: researchContext || undefined }),
        })
        const resData = await res.json() as {
          title?: string; content?: string; summary?: string
          tags?: string[]; seoTitle?: string; seoDesc?: string; suggestedSlug?: string
          newBalance?: number | null; model?: string; error?: string; balance?: number; cost?: number
        }
        if (!res.ok) {
          let errMsg = resData.error ?? '請稍後再試'
          if (res.status === 401) errMsg = '請先登入才能使用 AI 寫作功能'
          if (res.status === 402) errMsg = `Z幣不足！需要 ${resData.cost ?? 200} Z幣，你目前有 ${resData.balance ?? 0} Z幣`
          setMessages(prev => appendMessage(prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: character === 'riku' ? `...失敗了。${errMsg}` : `哎呀出錯了 QQ ${errMsg}`,
            mood: 'sad',
          }))
        } else {
          const data = resData as {
            title: string; content: string; summary: string
            tags: string[]; seoTitle: string; seoDesc: string; suggestedSlug: string
            newBalance?: number | null
          }
          // 存到 localStorage，讓部落格編輯器讀取
          if (typeof window !== 'undefined') {
            localStorage.setItem('yukirin_blog_draft', JSON.stringify({
              ...data,
              createdAt: Date.now(),
              character,
            }))
          }

          const doneVariants = character === 'riku' ? [
            `完成了。\n\n**「${data.title}」**\n\n摘要：${data.summary.slice(0, 60)}...\n標籤：${data.tags.slice(0, 3).join('、')}\n\n前往部落格編輯器套用 →`,
          ] : [
            `寫好了！✨\n\n**「${data.title}」**\n\n${data.summary.slice(0, 60)}...\n\n標籤：${data.tags.slice(0, 3).join('、')}\n\n去看看成品，沒問題就可以直接發布～`,
            `完成！來看看我寫的～ ✨\n\n**「${data.title}」**\n\n${data.summary.slice(0, 60)}...\n標籤：${data.tags.slice(0, 3).join('、')}\n\n點下面的按鈕套用到部落格編輯器吧！`,
          ]
          const doneMsg = doneVariants[Math.floor(Math.random() * doneVariants.length)]

          yukirinRef.current?.setMood('happy', 300)
          setMessages(prev => appendMessage(prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: doneMsg,
            mood: 'happy',
          }))
          setBlogWriteMode(false)
          // 更新 Z幣餘額
          if (data.newBalance !== undefined && data.newBalance !== null) {
            setTurnsInfo(prev => prev ? { ...prev, zcoinBalance: data.newBalance! } : null)
          }
          setQuickReplies(['前往部落格編輯器', '再寫一篇'])
        }
      } catch {
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: character === 'riku' ? '...網路錯誤。' : '哎呀網路有點問題 QQ 等一下再試試看？',
          mood: 'sad',
        }))
      } finally {
        setBlogWriting(false)
        setIsLoading(false)
      }
      return
    }

    // ── 斜線指令：零 Token 即時回應 ────────────────────────────────────────
    if (isSlashCommand(text)) {
      const slashResult = handleSlashCommand(text, buildSlashState())
      if (slashResult) {
        const responseText = slashResult.yukirin?.text ?? '好！'
        const mood = (slashResult.yukirin?.mood ?? 'happy') as YukirinMood
        const animation = slashResult.yukirin?.animation ?? null

        yukirinRef.current?.setMood(mood, 300)
        if (animation) yukirinRef.current?.playAnimation(animation)

        if (!slashResult.needsLLM) {
          // 特殊 action：show_command_list — 直接在對話裡顯示指令清單
          const cmdListText = slashResult.action?.type === 'show_command_list'
            ? [
                '\n\n📋 **基本**',
                '/問卷 /結果 /Z幣 /商城 /成就 /每日任務',
                '\n🎮 **互動**',
                '/揮手 /拍頭 /抱抱 /跳舞 /戳 /嚇 /加油 /開心 /哭哭 /生氣',
                '/早安 /睡覺 /坐下 /站起來 /思考 /點頭 /搖頭 /唱歌',
                '/謝謝 /好厲害 /無聊',
                '\n💫 **角色**',
                '/切換角色 /告白 /叫另一半 /放閃 /吃醋 /約會',
                '\n🎉 **娛樂**',
                '/說笑話 /說故事 /占卜 /猜拳 /翻譯 /計算 /問問題',
                '/推薦音樂 /推薦電影 /推薦書 /文字遊戲 /腦筋急轉彎',
                '\n🗺️ **導航**',
                '/首頁 /個人檔案 /我的文章 /收藏 /探索',
                '\n🔧 **工具**',
                '/設定 /週報 /創作文章 /意見回饋 /常見問題',
                '\n📣 **行銷**',
                '/寫貼文 /廣告文案 /SEO /內容策略 /電子報',
                '/行銷分析 /競品分析 /品牌定位 /KOL企劃 /活動企劃',
                turnsInfo?.isAdmin ? '\n\n👑 **管理員**\n/後台 /問卷管理 /填答記錄 /AI洞察 /標籤分析 /漏斗分析\n/LINE推播 /LINE設定 /AI設定 /團隊管理 /生成問卷 /今日填答\n/stats /cost /alerts' : '',
                turnsInfo?.isOwner ? '\n\n🔑 **老闆（只有你看得到）**\n📊 /全平台 /財報 /今日報告 /AI成本 /問卷總覽 /週趨勢\n👥 /租戶 /用戶 /發Z幣 /禮遇 /模擬登入\n🖥️ /系統狀態 /部署 /錯誤日誌\n📣 /公告 /文章管理 /提示詞 /清記憶\n✨ /老闆模式' : '',
              ].join('\n')
            : null

          // 特殊 action：blog_write_mode — 進入部落格創作模式
          if (slashResult.action?.type === 'blog_write_mode') {
            setBlogWriteMode(true)
            const BLOG_WRITE_GREETINGS = character === 'riku' ? [
              '...創作文章？說吧，主題是什麼。（需要 200 Z幣）',
              '嗯。告訴我你想寫什麼，我來幫你。',
              '...行。什麼主題？寫清楚一點。',
            ] : [
              '哦！要請我幫忙寫文章嗎～ 告訴我你想寫什麼！\n\n✨ 我會幫你把標題、內容、標籤、SEO 全部一次搞定\n（需要 200 Z幣）',
              '寫文章！我最喜歡這種任務了～\n說說看，你想分享什麼故事或想法？\n（需要 200 Z幣）',
              '好耶！AI 創作模式～✨\n你想寫什麼主題？說詳細一點，我寫得更好！\n（需要 200 Z幣）',
            ]
            const greeting = BLOG_WRITE_GREETINGS[Math.floor(Math.random() * BLOG_WRITE_GREETINGS.length)]
            yukirinRef.current?.setMood('excited', 300)
            yukirinRef.current?.playAnimation('excited')
            setMessages(prev => appendMessage(prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              text: greeting,
              mood: 'excited',
            }))
            setQuickReplies(['分享旅遊體驗', '寫產品心得', '記錄生活感悟'])
            return
          }

          setMessages(prev => appendMessage(prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: cmdListText ? responseText + cmdListText : responseText,
            mood,
          }))
          // 執行 action
          if (slashResult.action?.type === 'fetch_owner_data') {
            // 老闆指令：從 API 查真實數據
            fetch(`/api/guide/owner-data?cmd=${slashResult.action.target}`)
              .then(r => r.json())
              .then((d: { text?: string }) => {
                if (d.text) {
                  setMessages(prev => appendMessage(prev, {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    text: d.text ?? '',
                    mood: 'happy',
                  }))
                }
              })
              .catch(() => {
                setMessages(prev => appendMessage(prev, {
                  id: (Date.now() + 2).toString(),
                  role: 'assistant',
                  text: character === 'riku' ? '...查詢失敗' : '哎呀查不到資料 QQ',
                  mood: 'sad',
                }))
              })
            setQuickReplies(DEFAULT_QUICK_REPLIES)
            return
          }
          if (slashResult.action?.type === 'navigate') router.push(slashResult.action.target)
          if (slashResult.action?.type === 'switch_character' && onSwitchCharacter) {
            onSwitchCharacter(slashResult.action.target as 'yukirin' | 'riku')
          }
          if (slashResult.action?.type === 'set_presence_mode') {
            const mode = slashResult.action.target as 'mini' | 'chat' | 'companion' | 'free' | 'couple_free'
            const resolvedMode = mode === 'couple_free' ? 'free' : mode
            setPresenceMode(resolvedMode)
            onPresenceModeChange?.(resolvedMode)
          }
          if (slashResult.action?.type === 'resize_character') {
            if (slashResult.action.target === 'bigger') setCharacterSize(prev => Math.min(2.0, prev + 0.3))
            if (slashResult.action.target === 'smaller') setCharacterSize(prev => Math.max(0.5, prev - 0.3))
          }
          setQuickReplies(DEFAULT_QUICK_REPLIES)
          return
        }

        // needsLLM = true：顯示思考中提示，繼續走 LLM 流程
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: responseText,
          mood,
        }))
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    setIsLoading(true)
    setStreamingText('')
    setQuickReplies([])

    // 排除情侶插話，避免污染 AI 對話歷史
    const history: GuideMessage[] = messages
      .filter(m => !m.isPartner)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.text }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          character: character ?? 'yukirin',
          context: {
            currentPage: pathname ?? '/',
            currentAnimation: yukirinRef.current?.getCurrentAnimation?.(),
            currentMood: yukirinRef.current?.getCurrentMood?.(),
          },
          history,
          coupleCount: coupleCountRef.current,
          lastCoupleAt: lastCoupleAtRef.current,
        }),
        signal: abortRef.current.signal,
      })

      // 次數用完 → 顯示購買面板
      if (res.status === 402) {
        const data = await res.json()
        setTurnsInfo(prev => prev
          ? { ...prev, freeRemaining: 0, purchasedCredits: 0, isLoggedIn: data.isLoggedIn }
          : { isUnlimited: false, freeRemaining: 0, purchasedCredits: 0, zcoinBalance: null, isLoggedIn: data.isLoggedIn }
        )
        yukirinRef.current?.setMood('sad', 300)
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: '欸嘿，今天的次數用完了 😴 用 Z幣 換更多對話吧～',
          mood: 'sad',
        }))
        setShowBuyPanel(true)
        return
      }

      // AI 暫時不可用 → 備用腳本
      if (res.status === 503) {
        const fallback = getFallbackResponse(text)
        yukirinRef.current?.setMood(fallback.mood, 300)
        setStreamingText('')
        setMessages(prev => appendMessage(prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: fallback.text,
          mood: fallback.mood,
        }))
        setQuickReplies(fallback.quickReplies ?? DEFAULT_QUICK_REPLIES)
        return
      }

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let accText = ''
      let finalMood: YukirinMood = 'happy'
      let finalAction: GuideAction | null = null
      let finalQuickReplies: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6)) as {
              type: string
              mood?: YukirinMood
              text?: string
              chunk?: string
              action?: GuideAction | null
              quickReplies?: string[] | null
              animation?: string | null
              isUnlimited?: boolean
              freeRemaining?: number | null
              purchasedRemaining?: number | null
              // 情侶互動
              partner?: string
              partnerLine?: string
              partnerMood?: string
              activeLine?: string
              activeMood?: string
            }

            if (evt.type === 'mood' && evt.mood) {
              yukirinRef.current?.setMood(evt.mood, 300)
              finalMood = evt.mood
            }

            if (evt.type === 'chunk' && evt.text) {
              accText += evt.text
              setStreamingText('...')
            }

            if (evt.type === 'complete') {
              if (evt.mood) {
                yukirinRef.current?.setMood(evt.mood, 400)
                finalMood = evt.mood
              }
              if (evt.text) accText = evt.text
              if (evt.action) finalAction = evt.action
              if (evt.quickReplies) finalQuickReplies = evt.quickReplies
              // 觸發動作動畫（雪凜自我感知系統）
              if (evt.animation) {
                yukirinRef.current?.playAnimation(evt.animation)
              }

              // 更新次數顯示
              if (!evt.isUnlimited && evt.freeRemaining !== undefined) {
                setTurnsInfo(prev => prev ? {
                  ...prev,
                  freeRemaining: evt.freeRemaining ?? null,
                  purchasedCredits: evt.purchasedRemaining ?? prev.purchasedCredits,
                } : null)
              }
            }
            // ── 情侶互動插話 ──────────────────────────────────────────────
            if (evt.type === 'couple_popup' && evt.partnerLine) {
              const partnerName = evt.partner === 'riku' ? '凜空' : '雪凜'
              // 更新 session 狀態
              coupleCountRef.current += 1
              lastCoupleAtRef.current = Date.now()
              // 插入夥伴的台詞
              setMessages(prev => appendMessage(prev, {
                id: `cp-${Date.now()}`,
                role: 'assistant',
                text: evt.partnerLine!,
                mood: (evt.partnerMood ?? 'neutral') as YukirinMood,
                isPartner: true,
                partnerName,
              }))
              // 1.5 秒後插入主角回應
              if (evt.activeLine) {
                const activeLineText = evt.activeLine
                const activeMoodVal = (evt.activeMood ?? 'happy') as YukirinMood
                setTimeout(() => {
                  yukirinRef.current?.setMood(activeMoodVal, 300)
                  setMessages(prev => appendMessage(prev, {
                    id: `ca-${Date.now()}`,
                    role: 'assistant',
                    text: activeLineText,
                    mood: activeMoodVal,
                  }))
                }, 1500)
              }
            }

          } catch { /* skip */ }
        }
      }

      setStreamingText('')
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: accText || '欸嘿，我想了一下沒想出來 😅',
        mood: finalMood,
      }
      setMessages(prev => appendMessage(prev, assistantMsg))
      saveMessages([userMsg, assistantMsg])

      if (finalAction) executeAction(finalAction)
      setQuickReplies(finalQuickReplies.length > 0 ? finalQuickReplies : DEFAULT_QUICK_REPLIES)

    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setStreamingText('')
      const fallback = getFallbackResponse(text)
      yukirinRef.current?.setMood(fallback.mood, 300)
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: fallback.text,
        mood: fallback.mood,
      }))
      setQuickReplies(fallback.quickReplies ?? DEFAULT_QUICK_REPLIES)
    } finally {
      setIsLoading(false)
      // AI 回覆完畢後重新 focus 輸入框
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isLoading, messages, pathname, executeAction, buildSlashState, router])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputRef.current) inputRef.current.style.height = 'auto'
    sendMessage(input)
  }, [input, sendMessage])

  const handleQuickReply = useCallback((text: string) => {
    // 特殊快速回覆：前往部落格編輯器（草稿已存 localStorage，blog 頁面會自動載入）
    if (text === '前往部落格編輯器') {
      const m2 = pathname?.match(/^\/insight-admin\/([^/]+)/)
      const slug2 = m2?.[1]
      router.push(slug2 ? `/insight-admin/${slug2}/blog` : '/insight-admin/blog')
      return
    }
    // 再寫一篇 → 重新進入 blog write mode
    if (text === '再寫一篇') {
      setBlogWriteMode(true)
      const greeting = character === 'riku' ? '...什麼主題？' : '好！這次要寫什麼？'
      setMessages(prev => appendMessage(prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: greeting,
        mood: 'happy',
      }))
      setQuickReplies(['分享旅遊體驗', '寫產品心得', '記錄生活感悟'])
      return
    }
    sendMessage(text)
  }, [sendMessage, router, character])

  const handleBought = useCallback((addedTurns: number, newBalance: number, totalCredits: number) => {
    setTurnsInfo(prev => prev ? {
      ...prev,
      purchasedCredits: totalCredits,
      zcoinBalance: newBalance,
    } : null)
    setShowBuyPanel(false)
    yukirinRef.current?.setMood('excited', 300)
    setMessages(prev => appendMessage(prev, {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      text: `欸嘿！成功換到 ${addedTurns} 次對話了 🎉 繼續聊吧～`,
      mood: 'excited',
    }))
    setQuickReplies(DEFAULT_QUICK_REPLIES)
  }, [])

  // 接收外部自動發送指令事件（例如從部落格編輯器觸發 /創作文章）
  useEffect(() => {
    const handleAutoSend = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text
      if (text) sendMessage(text)
    }
    window.addEventListener('yukirin:auto-send', handleAutoSend)
    return () => window.removeEventListener('yukirin:auto-send', handleAutoSend)
  }, [sendMessage])

  // 次數倒數顯示文字
  const turnsLabel = (() => {
    if (!turnsInfo || turnsInfo.isUnlimited) return null
    const free = turnsInfo.freeRemaining ?? 0
    const bought = turnsInfo.purchasedCredits ?? 0
    if (free > 0) return { text: `💬 免費 ${free} / 20`, color: free <= 5 ? 'text-amber-400' : 'text-white/30' }
    if (bought > 0) return { text: `💎 購買 ${bought} 次`, color: 'text-[#b8a9e8]' }
    return { text: '💬 次數已用完', color: 'text-red-400' }
  })()

  const isInputDisabled = isLoading || (
    !turnsInfo?.isUnlimited &&
    turnsInfo !== null &&
    (turnsInfo.freeRemaining ?? 0) <= 0 &&
    (turnsInfo.purchasedCredits ?? 0) <= 0
  )

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-white/10 w-full h-full"
      style={{ background: 'rgba(15,9,30,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* ── 角色 3D 頭像區 ─────────────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ height: 130 }}>
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {character === 'riku' ? (
            <RikuScene
              cameraMode="upperBody"
              mood="happy"
              showBackground={false}
              onLoad={handleLoad as (c: any) => void}
              characterSize={characterSize}
              className="w-full h-full"
            />
          ) : (
            <YukirinScene
              cameraMode="upperBody"
              mood="happy"
              showBackground={false}
              onLoad={handleLoad as (c: any) => void}
              characterSize={characterSize}
              className="w-full h-full"
            />
          )}
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-2.5 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1 pointer-events-none">
            <svg width="8" height="10" viewBox="0 0 8 10" fill="rgba(255,255,255,0.2)">
              <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
              <circle cx="2" cy="5" r="1"/><circle cx="6" cy="5" r="1"/>
              <circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/>
            </svg>
            <span className="text-white/90 text-xs font-semibold drop-shadow">
              {character === 'riku' ? '凜空' : '雪凜'}
            </span>
            <span className="text-white/40 text-[10px]">AI 嚮導</span>
            {turnsInfo !== null && (
              <span
                title={`isOwner=${turnsInfo.isOwner} isAdmin=${turnsInfo.isAdmin} isUnlimited=${turnsInfo.isUnlimited}`}
                className={`text-[8px] px-1 py-0.5 rounded-full font-mono pointer-events-auto cursor-help select-none ${
                  turnsInfo.isOwner
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : turnsInfo.isAdmin
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-white/5 text-white/20 border border-white/10'
                }`}
              >
                {turnsInfo.isOwner ? '👑boss' : turnsInfo.isAdmin ? '🛡️admin' : '👤user'}
              </span>
            )}
          </div>
          {/* 角色切換（面板內） */}
          {onSwitchCharacter && (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <button
                onClick={() => onSwitchCharacter('yukirin')}
                onPointerDown={e => e.stopPropagation()}
                className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${character === 'yukirin' ? 'bg-[#b8a9e8]/40 text-white' : 'text-white/30 hover:text-white/70'}`}
              >🌸</button>
              <button
                onClick={() => onSwitchCharacter('riku')}
                onPointerDown={e => e.stopPropagation()}
                className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${character === 'riku' ? 'bg-[#a8d0e8]/40 text-white' : 'text-white/30 hover:text-white/70'}`}
              >❄️</button>
            </div>
          )}
          <button
            onClick={onClose}
            onPointerDown={e => e.stopPropagation()}
            className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors text-[10px]"
          >
            ✕
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,9,30,0.92))' }}
        />
      </div>

      {/* ── 訊息列表 ───────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10"
        onPointerDown={e => e.stopPropagation()}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* 情侶插話：紅色泡泡 */}
            {msg.isPartner ? (
              <div className="max-w-[85%]">
                <div className="text-[9px] text-red-400/60 mb-0.5 pl-1">👀 {msg.partnerName} 插話</div>
                <div
                  className="text-xs leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm border border-red-400/20 text-white/80"
                  style={{ background: 'rgba(220,80,80,0.10)' }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className={`max-w-[80%] ${msg.role === 'assistant' ? '' : 'flex flex-col items-end gap-1'}`}>
                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="傳送的圖片"
                    className="rounded-xl max-w-[160px] max-h-[120px] object-cover border border-white/15 mb-1"
                  />
                )}
                <div
                  className={`text-xs leading-relaxed px-3 py-2 rounded-2xl ${
                    msg.role === 'assistant'
                      ? 'text-white/85 border border-[#b8a9e8]/20 rounded-bl-sm'
                      : 'text-white/85 border border-white/15 rounded-br-sm'
                  }`}
                  style={
                    msg.role === 'assistant'
                      ? { background: 'rgba(184,169,232,0.10)' }
                      : { background: 'linear-gradient(135deg, rgba(184,169,232,0.2), rgba(245,184,181,0.15))' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="text-xs px-3 py-2 rounded-2xl rounded-bl-sm border border-[#b8a9e8]/20"
              style={{ background: 'rgba(184,169,232,0.10)' }}
            >
              <span className="inline-flex gap-0.5 items-center text-white/40">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 快捷回覆 ──────────────────────────────────────── */}
      {quickReplies.length > 0 && !isLoading && !showBuyPanel && (
        <div className="px-3 pb-1.5 flex gap-1.5 flex-wrap" onPointerDown={e => e.stopPropagation()}>
          {quickReplies.map(qr => (
            <button
              key={qr}
              onClick={() => handleQuickReply(qr)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[#b8a9e8]/30 text-[#c8b8f0] hover:bg-[#b8a9e8]/15 transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* ── 次數倒數 chip ─────────────────────────────────── */}
      {turnsLabel && !showBuyPanel && (
        <div
          className="px-3 pb-1 flex items-center justify-between"
          onPointerDown={e => e.stopPropagation()}
        >
          <span className={`text-[10px] ${turnsLabel.color}`}>{turnsLabel.text}</span>
          {(turnsInfo?.freeRemaining ?? 1) <= 0 && (turnsInfo?.purchasedCredits ?? 0) <= 0 && (
            <button
              onClick={() => setShowBuyPanel(true)}
              className="text-[10px] text-[#b8a9e8] hover:text-white transition-colors"
            >
              Z幣購買 →
            </button>
          )}
        </div>
      )}

      {/* ── 購買面板 或 輸入區 ─────────────────────────────── */}
      {showBuyPanel ? (
        <BuyTurnsPanel
          zcoinBalance={turnsInfo?.zcoinBalance ?? null}
          isLoggedIn={turnsInfo?.isLoggedIn ?? false}
          onBought={handleBought}
          onClose={() => setShowBuyPanel(false)}
        />
      ) : (
        <div onPointerDown={e => e.stopPropagation()}>
          {/* 斜線指令自動完成下拉 */}
          {cmdSuggestions.length > 0 && (
            <div className="mx-3 mb-1 rounded-xl border border-white/10 overflow-y-auto"
              style={{ background: 'rgba(15,9,30,0.97)', maxHeight: 180 }}
            >
              {cmdSuggestions.slice(0, 120).map(cmd => (
                <button
                  key={cmd.command}
                  onClick={() => { setCmdSuggestions([]); sendMessage(cmd.command) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/8 transition-colors"
                >
                  <span className="text-[10px] font-mono text-[#b8a9e8]">{cmd.command}</span>
                  <span className="text-[10px] text-white/35 truncate">{cmd.description}</span>
                </button>
              ))}
            </div>
          )}
          {/* 圖片預覽條 */}
          {uploadedImage && (
            <div className="px-3 pb-1.5 flex items-center gap-2">
              <div className="relative">
                <img
                  src={uploadedImage.preview}
                  alt="預覽"
                  className="w-12 h-12 rounded-lg object-cover border border-white/15"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 text-white/70 text-[9px] flex items-center justify-center hover:bg-black"
                >✕</button>
              </div>
              <span className="text-[10px] text-white/40 flex-1">
                {turnsInfo?.isUnlimited ? '（平台特權，免費分析）' : `分析圖片 -${20} Z幣`}
              </span>
              <button
                onClick={handleSendImage}
                disabled={isAnalyzing}
                className="text-[10px] px-2.5 py-1 rounded-full text-white font-medium transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #b8a9e8, #f5b8b5)' }}
              >
                {isAnalyzing ? '分析中...' : '送出 →'}
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 px-3 pb-3 pt-1 border-t border-white/8"
          >
            {/* 圖片上傳 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isInputDisabled || !!uploadedImage}
              title="傳送圖片（20 Z幣）"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <rect x="1" y="2.5" width="12" height="9" rx="1.5"/>
                <circle cx="4.5" cy="5.5" r="1"/>
                <path d="M1 10l3-3 2 2 3-3 4 4"/>
              </svg>
            </button>

            {/* 語音輸入 */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isInputDisabled}
              title={isRecording ? '停止錄音' : '語音輸入（免費）'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                isRecording
                  ? 'bg-red-500/30 text-red-400 animate-pulse'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/8 disabled:opacity-30'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <rect x="4" y="1" width="5" height="7" rx="2.5"/>
                <path d="M1.5 6.5a5 5 0 0010 0"/>
                <line x1="6.5" y1="11.5" x2="6.5" y2="13"/>
              </svg>
            </button>

            <textarea
              ref={inputRef}
              autoFocus
              rows={1}
              value={input}
              onChange={e => {
                const v = e.target.value
                setInput(v)
                setCmdSuggestions(v.startsWith('/') ? getCommandSuggestions(v, turnsInfo?.isAdmin ?? false, turnsInfo?.isOwner ?? false) : [])
                // 自動調整高度
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
              }}
              onKeyDown={e => {
                // Shift+Enter = 換行（預設行為）
                // Enter alone = 送出
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isInputDisabled) sendMessage(input)
                }
              }}
              placeholder={isInputDisabled && !isLoading ? '次數已用完，請購買或明天再來' : '跟雪凜說點什麼... 或輸入 /（Shift+Enter 換行）'}
              disabled={isInputDisabled}
              className="flex-1 bg-white/8 border border-white/10 rounded-2xl px-3 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-[#b8a9e8]/40 transition-colors disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
              style={{ fontSize: 12, minHeight: 30, maxHeight: 96 }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isInputDisabled}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #b8a9e8, #f5b8b5)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </button>
          </form>
          {/* 版本標記（debug 用，確認部署版本） */}
          {turnsInfo?.isOwner && (
            <div className="text-center text-[8px] text-white/15 pb-0.5">v0401c</div>
          )}
        </div>
      )}
    </div>
  )
}

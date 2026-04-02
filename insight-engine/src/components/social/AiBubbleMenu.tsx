'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Loader2, Undo2, Sparkles, Scissors, BookOpen, Wrench, Globe } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type AiTextAction = 'rewrite' | 'shorten' | 'expand' | 'fix' | 'translate'

interface AiAction {
  key: AiTextAction
  label: string
  icon: React.ReactNode
}

const AI_ACTIONS: AiAction[] = [
  { key: 'rewrite',   label: '改寫', icon: <Sparkles  className="w-3 h-3" /> },
  { key: 'shorten',   label: '精簡', icon: <Scissors  className="w-3 h-3" /> },
  { key: 'expand',    label: '展開', icon: <BookOpen   className="w-3 h-3" /> },
  { key: 'fix',       label: '修正', icon: <Wrench     className="w-3 h-3" /> },
  { key: 'translate', label: '翻譯', icon: <Globe      className="w-3 h-3" /> },
]

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  editor: Editor
}

export default function AiBubbleMenu({ editor }: Props) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<AiTextAction | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Position tracking ──────────────────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!editor || loading) return
    const { selection } = editor.state
    if (selection.empty) {
      setVisible(false)
      setShowUndo(false)
      setError('')
      return
    }

    try {
      const fromCoords = editor.view.coordsAtPos(selection.from)
      const toCoords = editor.view.coordsAtPos(selection.to)
      const centerX = (fromCoords.left + toCoords.right) / 2
      setPosition({ x: centerX, y: fromCoords.top - 8 })
      setVisible(true)
    } catch {
      /* coords may fail on edge cases */
    }
  }, [editor, loading])

  useEffect(() => {
    if (!editor) return

    const onSelectionUpdate = () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      // Small delay to avoid flickering during rapid selection changes
      hideTimeoutRef.current = setTimeout(updatePosition, 80)
    }

    const onBlur = () => {
      // Delay hide so clicking menu buttons doesn't dismiss it
      hideTimeoutRef.current = setTimeout(() => {
        if (!menuRef.current?.matches(':hover')) {
          setVisible(false)
          setError('')
        }
      }, 200)
    }

    editor.on('selectionUpdate', onSelectionUpdate)
    editor.on('blur', onBlur)

    return () => {
      editor.off('selectionUpdate', onSelectionUpdate)
      editor.off('blur', onBlur)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [editor, updatePosition])

  // ─── AI action handler ──────────────────────────────────────────────────

  const handleAction = async (action: AiTextAction) => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    if (!selectedText.trim()) return

    setLoading(true)
    setActiveAction(action)
    setError('')
    setShowUndo(false)

    try {
      const res = await fetch('/api/admin/social/blog/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, action }),
      })

      const data = await res.json() as { result?: string; error?: string }

      if (!res.ok || !data.result) {
        setError(data.error ?? 'AI 處理失敗')
        return
      }

      // Replace selected text with AI result
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, data.result)
        .run()

      setShowUndo(true)

      // Auto-hide undo after 5 seconds
      setTimeout(() => setShowUndo(false), 5000)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  const handleUndo = () => {
    editor.chain().focus().undo().run()
    setShowUndo(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!visible && !loading) return null

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 10000,
      }}
      className="pointer-events-auto"
      onMouseDown={e => e.preventDefault()}
    >
      <div className="flex items-center gap-0.5 px-1 py-0.5 bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-lg">
        {/* AI icon label */}
        <span className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-violet-300/70 font-medium select-none">
          <Sparkles className="w-3 h-3" />
          AI
        </span>
        <div className="w-px h-4 bg-white/8" />

        {loading ? (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Loader2 className="w-3 h-3 text-violet-300 animate-spin" />
            <span className="text-[11px] text-white/50">
              {activeAction && AI_ACTIONS.find(a => a.key === activeAction)?.label}...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="text-[11px] text-rose-400">{error}</span>
          </div>
        ) : showUndo ? (
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-amber-300 hover:bg-white/8 rounded transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            復原
          </button>
        ) : (
          AI_ACTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleAction(key)}
              className="flex items-center gap-1 px-1.5 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/8 rounded transition-colors whitespace-nowrap"
              title={label}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

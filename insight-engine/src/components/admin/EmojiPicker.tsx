'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/** Emoji 分類資料 — 來自 MaoTravelBlog EmojiStickerPicker */
const EMOJI_CATEGORIES = [
  {
    id: 'animals',
    name: '動物',
    icon: '🐾',
    emojis: [
      '🐱', '🐶', '🐰', '🐹', '🐭', '🐷', '🐸', '🐙', '🐝', '🐛',
      '🦋', '🐌', '🐢', '🐍', '🦎', '🐊', '🐅', '🐆', '🦓', '🦏',
      '🐘', '🦛', '🦌', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐎',
      '🐕', '🐈', '🐦', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐙',
      '🦑', '🦐', '🦀', '🐢', '🦜', '🦩', '🦚', '🐓', '🦆', '🐧',
    ],
  },
  {
    id: 'faces',
    name: '表情',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
      '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
      '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
      '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
      '🥵', '🥶', '😱', '😨', '😰', '😥', '😢', '🫥', '🤔', '🤗',
      '🙋', '🤷', '🙅', '🤏', '😶', '😐', '💯', '👌',
    ],
  },
  {
    id: 'hearts',
    name: '愛心',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
    ],
  },
  {
    id: 'objects',
    name: '物品',
    icon: '🎁',
    emojis: [
      '🎁', '🎈', '🎉', '🎊', '🎀', '🏆', '🥇', '🥈', '🥉', '⭐',
      '🌟', '💫', '✨', '🔥', '💧', '⚡', '🌈', '☀️', '🌙', '🌍',
      '🎯', '🎮', '🕹️', '🎲', '🃏', '🎭', '🖼️', '🎨', '📸', '📱',
      '📲', '📝', '📖', '📋', '🗺️', '📅', '📆', '🔍', '🔓', '🔑',
      '💎', '💰', '💸', '🆓', '🔄', '❓', '❔', '💬', '📡', '🔊',
    ],
  },
  {
    id: 'nature',
    name: '自然',
    icon: '🌿',
    emojis: [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '💐', '🌿', '🍀', '🌱',
      '🌳', '🌲', '🎋', '🎍', '🏵️', '🌾', '🍁', '🍂', '🍃', '🌊',
      '🌙', '⭐', '🌟', '✨', '🏔️', '🏝️', '🏜️', '🌋', '🏯', '🏮',
      '🎋', '🐚', '🌅', '🌄', '🎐', '🌀', '🫧',
    ],
  },
  {
    id: 'food',
    name: '食物',
    icon: '🍬',
    emojis: [
      '🍬', '🍭', '🧁', '🎂', '🍰', '🍩', '🍪', '🍫', '🍮', '🍯',
      '🍼', '☕', '🧃', '🥤', '🍻', '🥂', '🍷', '🍸', '🍹', '🧋',
      '🍕', '🍔', '🌮', '🍣', '🍙', '🍜', '🍝', '🥗', '🥙', '🍗',
    ],
  },
  {
    id: 'travel',
    name: '旅行',
    icon: '✈️',
    emojis: [
      '✈️', '🚀', '🛸', '🚂', '🚃', '🚗', '🏠', '🏡', '🏰', '⛺',
      '🎡', '🎢', '🎪', '🗼', '🗽', '🗾', '🌏', '🧭', '🎒', '🧳',
      '⏰', '🕰️', '⏱️', '🕯️', '📸', '🗺️', '🏕️', '🌅', '🎆', '🎇',
    ],
  },
  {
    id: 'symbols',
    name: '符號',
    icon: '💠',
    emojis: [
      '✅', '❌', '⭕', '❗', '❓', '💡', '💪', '👍', '👎', '👏',
      '🙌', '🤝', '✌️', '🤞', '🫶', '👀', '👋', '🖐️', '✋', '🤚',
      '🚫', '⛔', '♻️', '💠', '🔰', '⚜️', '🏅', '🎖️', '📌', '🔗',
    ],
  },
] as const

interface EmojiPickerProps {
  /** 目前選中的 emoji */
  value?: string
  /** 選中 emoji 時回調 */
  onSelect: (emoji: string) => void
  /** 清除 emoji */
  onClear?: () => void
}

export function EmojiPicker({ value, onSelect, onClear }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('animals')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // 點擊外部關閉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handlePick = useCallback(
    (emoji: string) => {
      onSelect(emoji)
      setOpen(false)
    },
    [onSelect],
  )

  const currentCat = EMOJI_CATEGORIES.find((c) => c.id === category)
  const emojis = currentCat?.emojis ?? []

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 flex items-center justify-center text-lg transition-colors cursor-pointer"
        title="選擇 Emoji"
      >
        {value || '😀'}
      </button>

      {/* 清除按鈕 */}
      {value && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center cursor-pointer hover:bg-red-400"
          title="清除"
        >
          ✕
        </button>
      )}

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-[320px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋 emoji..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-0.5 px-2 pt-2 pb-1 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  category === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/40 hover:text-white/60 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="p-2 max-h-50 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {emojis
                .filter((e) => !search || e.includes(search))
                .map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => handlePick(emoji)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-slate-700 hover:scale-110 transition-all cursor-pointer ${
                      value === emoji ? 'bg-cyan-500/20 ring-1 ring-cyan-500/40' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          </div>

          {/* Quick Insert */}
          <div className="px-2 py-1.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-white/30">快捷</span>
            <div className="flex gap-0.5">
              {['🐾', '❤️', '🌟', '📸', '🎮', '💎', '🏆', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handlePick(emoji)}
                  className="w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-slate-700 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 匯出 emoji 分類資料供外部使用 */
export { EMOJI_CATEGORIES }

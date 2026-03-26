'use client'

import { useState } from 'react'
import { useTheme } from './ThemeContext'
import { questionTitleClass, optionClass } from '@/lib/themes'
import { getOptionEmoji } from '@/lib/optionEmoji'
import type { QuestionOption } from '@/types'

interface QuestionSingleProps {
  content: string
  options: QuestionOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  /** 題目的 emoji (由 question.emoji 傳入) */
  questionEmoji?: string
  /** 敘事副標 */
  narrative?: string
  /** 是否允許「其他」選項附帶文字輸入 */
  allowOtherText?: boolean
}

function isOtherOption(value: string): boolean {
  return value.includes('其他')
}

export function QuestionSingle({
  content,
  options,
  selectedValue,
  onSelect,
  questionEmoji,
  narrative,
  allowOtherText,
}: QuestionSingleProps) {
  const { theme } = useTheme()
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [pendingOtherValue, setPendingOtherValue] = useState<string | null>(null)
  const [otherText, setOtherText] = useState('')
  const useGrid = options.length <= 4

  const handleSelect = (value: string) => {
    if (allowOtherText && isOtherOption(value)) {
      // 「其他」選項：顯示文字輸入框，暫不呼叫 onSelect
      setFlippedCard(value)
      setPendingOtherValue(value)
      setOtherText('')
      return
    }
    setFlippedCard(value)
    setTimeout(() => onSelect(value), 350)
  }

  const confirmOther = () => {
    if (!pendingOtherValue) return
    const finalValue = otherText.trim()
      ? `${pendingOtherValue}:${otherText.trim()}`
      : pendingOtherValue
    setPendingOtherValue(null)
    setOtherText('')
    onSelect(finalValue)
  }

  const cancelOther = () => {
    setPendingOtherValue(null)
    setOtherText('')
    setFlippedCard(null)
  }

  const effectiveSelected = pendingOtherValue ?? selectedValue

  return (
    <div className="space-y-6">
      {questionEmoji && (
        <div className="text-center">
          <span className="text-4xl option-emoji-float">{questionEmoji}</span>
        </div>
      )}
      <h2 className={`${questionTitleClass[theme]} ${questionEmoji ? 'text-center' : ''}`}>
        {content}
      </h2>
      {narrative && (
        <p className={`text-sm opacity-60 ${questionEmoji ? 'text-center' : ''}`}>
          {narrative}
        </p>
      )}

      {/* 選項 — Grid 或 List */}
      {useGrid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = effectiveSelected === option.value
            const isFlipping = flippedCard === option.value
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`option-card-grid ${isFlipping ? 'option-card-flip' : ''} ${isSelected ? 'option-card-selected' : ''}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <span className="option-card-emoji">{emoji}</span>
                <span className="option-card-label">{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option, idx) => {
            const isSelected = effectiveSelected === option.value
            const isFlipping = flippedCard === option.value
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`${optionClass(theme, isSelected)} option-list-item ${isFlipping ? 'option-list-flip' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl option-emoji-bounce">{emoji}</span>
                  <span>{option.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 「其他」文字輸入框 */}
      {pendingOtherValue && (
        <div className="space-y-2 pt-2">
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmOther() }}
            placeholder="請輸入具體內容（選填）"
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmOther}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl transition-colors cursor-pointer"
            >
              確認
            </button>
            <button
              type="button"
              onClick={cancelOther}
              className="px-4 py-2 text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

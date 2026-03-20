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
}

export function QuestionSingle({
  content,
  options,
  selectedValue,
  onSelect,
  questionEmoji,
  narrative,
}: QuestionSingleProps) {
  const { theme } = useTheme()
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const useGrid = options.length <= 4

  const handleSelect = (value: string) => {
    setFlippedCard(value)
    // 延遲讓翻轉動畫播放
    setTimeout(() => onSelect(value), 350)
  }

  return (
    <div className="space-y-6">
      {/* 問題 Header — 有 emoji 時顯示大圖 */}
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
        <div className="grid grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedValue === option.value
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
            const isSelected = selectedValue === option.value
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
    </div>
  )
}

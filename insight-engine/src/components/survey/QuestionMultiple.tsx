'use client'

import { useState } from 'react'
import { useTheme } from './ThemeContext'
import { questionTitleClass, optionClass, checkboxClass, stepTextClass } from '@/lib/themes'
import { getOptionEmoji } from '@/lib/optionEmoji'
import type { QuestionOption } from '@/types'

interface QuestionMultipleProps {
  content: string
  options: QuestionOption[]
  selectedValues: string[]
  maxSelections?: number
  onToggle: (value: string) => void
  /** 更新整組答案（用於「其他」文字輸入時替換陣列中的值） */
  onAnswerUpdate?: (values: string[]) => void
  questionEmoji?: string
  narrative?: string
  /** 是否允許「其他」選項附帶文字輸入 */
  allowOtherText?: boolean
}

function isOtherOption(value: string): boolean {
  return value.includes('其他')
}

/** 從 selectedValues 中找出以「其他」開頭的值（含 "其他:text" 或 "其他"） */
function findOtherEntry(values: string[]): string | undefined {
  return values.find((v) => isOtherOption(v))
}

export function QuestionMultiple({
  content,
  options,
  selectedValues,
  maxSelections,
  onToggle,
  onAnswerUpdate,
  questionEmoji,
  narrative,
  allowOtherText,
}: QuestionMultipleProps) {
  const { theme } = useTheme()
  const [otherText, setOtherText] = useState('')
  const isAtLimit = maxSelections !== undefined && selectedValues.length >= maxSelections
  const useGrid = options.length <= 4

  // 判斷是否已選「其他」（可能是 "其他" 或 "其他:text"）
  const otherEntry = findOtherEntry(selectedValues)
  const otherSelected = !!otherEntry

  const handleToggle = (value: string) => {
    if (!allowOtherText || !isOtherOption(value)) {
      onToggle(value)
      return
    }

    if (otherSelected) {
      // 取消「其他」：從 selectedValues 移除 "其他" 或 "其他:text"
      if (onAnswerUpdate) {
        onAnswerUpdate(selectedValues.filter((v) => !isOtherOption(v)))
      } else {
        onToggle(value)
      }
      setOtherText('')
    } else {
      // 勾選「其他」：加入 selectedValues
      onToggle(value)
    }
  }

  const handleOtherTextChange = (text: string) => {
    setOtherText(text)
    if (!onAnswerUpdate) return
    const baseValue = options.find((o) => isOtherOption(o.value))?.value ?? '其他'
    const newEntry = text.trim() ? `${baseValue}:${text.trim()}` : baseValue
    const updated = selectedValues
      .filter((v) => !isOtherOption(v))
      .concat(newEntry)
    onAnswerUpdate(updated)
  }

  // 判斷某個 option 是否被選中（處理「其他:text」的情況）
  const isOptionSelected = (value: string) => {
    if (allowOtherText && isOtherOption(value)) return otherSelected
    return selectedValues.includes(value)
  }

  return (
    <div className="space-y-6">
      <div>
        {questionEmoji && (
          <div className="text-center mb-2">
            <span className="text-4xl option-emoji-float">{questionEmoji}</span>
          </div>
        )}
        <h2 className={`${questionTitleClass[theme]} ${questionEmoji ? 'text-center' : ''}`}>
          {content}
        </h2>
        {narrative && (
          <p className={`text-sm opacity-60 mt-1 ${questionEmoji ? 'text-center' : ''}`}>
            {narrative}
          </p>
        )}
        {maxSelections && (
          <p className={`${stepTextClass[theme]} mt-1 ${questionEmoji ? 'text-center' : ''}`}>
            已選 {selectedValues.length} / {maxSelections}
          </p>
        )}
      </div>

      {useGrid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = isOptionSelected(option.value)
            const isDisabled = !isSelected && isAtLimit
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => handleToggle(option.value)}
                className={`option-card-grid ${isSelected ? 'option-card-selected' : ''} ${isDisabled ? 'option-card-disabled' : ''}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <span className={`option-card-checkbox ${isSelected ? 'option-card-checkbox-active' : ''}`}>
                  {isSelected && '✓'}
                </span>
                <span className="option-card-emoji">{emoji}</span>
                <span className="option-card-label">{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option, idx) => {
            const isSelected = isOptionSelected(option.value)
            const isDisabled = !isSelected && isAtLimit
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => handleToggle(option.value)}
                className={`${optionClass(theme, isSelected, isDisabled)} option-list-item`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span className={checkboxClass(theme, isSelected)}>
                    {isSelected && '✓'}
                  </span>
                  <span className="text-xl option-emoji-bounce">{emoji}</span>
                  <span>{option.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 「其他」文字輸入框 */}
      {allowOtherText && otherSelected && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => handleOtherTextChange(e.target.value)}
          placeholder="請輸入具體內容（選填）"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
        />
      )}
    </div>
  )
}

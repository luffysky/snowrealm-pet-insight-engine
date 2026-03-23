'use client'

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
  questionEmoji?: string
  narrative?: string
}

export function QuestionMultiple({
  content,
  options,
  selectedValues,
  maxSelections,
  onToggle,
  questionEmoji,
  narrative,
}: QuestionMultipleProps) {
  const { theme } = useTheme()
  const isAtLimit = maxSelections !== undefined && selectedValues.length >= maxSelections
  const useGrid = options.length <= 4

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
            const isSelected = selectedValues.includes(option.value)
            const isDisabled = !isSelected && isAtLimit
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => onToggle(option.value)}
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
            const isSelected = selectedValues.includes(option.value)
            const isDisabled = !isSelected && isAtLimit
            const emoji = option.emoji || getOptionEmoji(option.label)
            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => onToggle(option.value)}
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
    </div>
  )
}

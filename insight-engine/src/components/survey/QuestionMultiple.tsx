'use client'

import type { QuestionOption } from '@/types'

interface QuestionMultipleProps {
  content: string
  options: QuestionOption[]
  selectedValues: string[]
  maxSelections?: number
  onToggle: (value: string) => void
}

export function QuestionMultiple({
  content,
  options,
  selectedValues,
  maxSelections,
  onToggle,
}: QuestionMultipleProps) {
  const isAtLimit = maxSelections !== undefined && selectedValues.length >= maxSelections

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-white/90 leading-relaxed">
          {content}
        </h2>
        {maxSelections && (
          <p className="text-sm text-white/40 mt-1">
            已選 {selectedValues.length} / {maxSelections}
          </p>
        )}
      </div>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          const isDisabled = !isSelected && isAtLimit

          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(option.value)}
              className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/10'
                  : isDisabled
                    ? 'bg-white/3 border-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                    isSelected
                      ? 'bg-cyan-400 border-cyan-400 text-slate-900'
                      : 'border-white/30'
                  }`}
                >
                  {isSelected && '✓'}
                </span>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

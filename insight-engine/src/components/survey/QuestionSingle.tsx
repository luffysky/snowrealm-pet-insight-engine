'use client'

import type { QuestionOption } from '@/types'

interface QuestionSingleProps {
  content: string
  options: QuestionOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
}

export function QuestionSingle({
  content,
  options,
  selectedValue,
  onSelect,
}: QuestionSingleProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-white/90 leading-relaxed">
        {content}
      </h2>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

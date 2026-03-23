'use client'
import { useTheme } from './ThemeContext'
import { questionTitleClass } from '@/lib/themes'

interface QuestionRatingProps {
  content: string
  value: number | null
  onChange: (value: number) => void
  max?: number
}

export function QuestionRating({ content, value, onChange, max = 5 }: QuestionRatingProps) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6">
      <h2 className={questionTitleClass[theme]}>{content}</h2>
      <div className="flex justify-center gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-4xl transition-all duration-200 cursor-pointer hover:scale-125 ${
              value !== null && star <= value ? 'text-amber-400 drop-shadow-lg' : 'text-white/20 hover:text-white/40'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value !== null && (
        <p className="text-center text-sm text-white/50">{value} / {max}</p>
      )}
    </div>
  )
}

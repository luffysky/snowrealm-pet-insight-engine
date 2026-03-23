'use client'
import { useTheme } from './ThemeContext'
import { questionTitleClass } from '@/lib/themes'

interface QuestionScaleProps {
  content: string
  value: number | null
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function QuestionScale({ content, value, onChange, min = 1, max = 10, step = 1 }: QuestionScaleProps) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6">
      <h2 className={questionTitleClass[theme]}>{content}</h2>
      <div className="space-y-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>{min}</span>
          <span className="text-lg font-bold text-white">{value ?? '-'}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}

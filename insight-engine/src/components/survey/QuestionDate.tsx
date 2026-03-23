'use client'
import { useTheme } from './ThemeContext'
import { questionTitleClass } from '@/lib/themes'

interface QuestionDateProps {
  content: string
  value: string
  onChange: (value: string) => void
  isRequired: boolean
}

export function QuestionDate({ content, value, onChange, isRequired }: QuestionDateProps) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6">
      <h2 className={questionTitleClass[theme]}>{content}</h2>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
      />
      {!isRequired && (
        <p className="text-xs text-white/40">此題為選填</p>
      )}
    </div>
  )
}

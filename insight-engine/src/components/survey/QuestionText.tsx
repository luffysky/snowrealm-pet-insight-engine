'use client'

import { useTheme } from './ThemeContext'
import { questionTitleClass, textareaClass, stepTextClass } from '@/lib/themes'

interface QuestionTextProps {
  content: string
  value: string
  onChange: (value: string) => void
  isRequired: boolean
}

export function QuestionText({
  content,
  value,
  onChange,
  isRequired,
}: QuestionTextProps) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6">
      <h2 className={questionTitleClass[theme]}>
        {content}
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isRequired ? '請輸入你的回答...' : '選填，可以直接跳過'}
        rows={4}
        className={textareaClass[theme]}
        maxLength={2000}
      />
      {!isRequired && (
        <p className={stepTextClass[theme]}>此題為選填</p>
      )}
    </div>
  )
}

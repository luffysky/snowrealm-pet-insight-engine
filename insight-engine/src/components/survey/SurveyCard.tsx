'use client'

import { useTheme } from './ThemeContext'
import { cardClass } from '@/lib/themes'

interface SurveyCardProps {
  children: React.ReactNode
}

export function SurveyCard({ children }: SurveyCardProps) {
  const { theme } = useTheme()
  return (
    <div className={cardClass[theme]}>
      {children}
    </div>
  )
}

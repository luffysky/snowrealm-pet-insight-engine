'use client'

import { useTheme } from './ThemeContext'
import { shellClass } from '@/lib/themes'

interface SurveyShellProps {
  children: React.ReactNode
}

export function SurveyShell({ children }: SurveyShellProps) {
  const { theme } = useTheme()
  return (
    <div className={shellClass[theme]}>
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}

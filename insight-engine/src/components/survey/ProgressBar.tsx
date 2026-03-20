'use client'

import { useTheme } from './ThemeContext'
import { progressTrackClass, progressBarClass, stepTextClass } from '@/lib/themes'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { theme } = useTheme()
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="space-y-2">
      <div className={progressTrackClass[theme]}>
        <div
          className={progressBarClass[theme]}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className={stepTextClass[theme]}>
        {currentStep} / {totalSteps}
      </p>
    </div>
  )
}

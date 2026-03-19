'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  )
}

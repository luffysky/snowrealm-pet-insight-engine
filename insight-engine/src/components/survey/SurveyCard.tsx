'use client'

interface SurveyCardProps {
  children: React.ReactNode
}

export function SurveyCard({ children }: SurveyCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/5">
      {children}
    </div>
  )
}

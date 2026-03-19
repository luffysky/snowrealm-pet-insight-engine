'use client'

interface SurveyShellProps {
  children: React.ReactNode
}

export function SurveyShell({ children }: SurveyShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}

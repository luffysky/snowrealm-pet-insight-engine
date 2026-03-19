interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

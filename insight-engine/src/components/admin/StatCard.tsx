interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6">
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-t-accent">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

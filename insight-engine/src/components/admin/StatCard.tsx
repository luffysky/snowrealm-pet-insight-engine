interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]">
      <p className="text-xs sm:text-sm text-[#8a7ca8] mb-1">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-[#6b5fa8]">{value}</p>
      {subtitle && (
        <p className="text-xs text-[#6b5fa8] mt-1">{subtitle}</p>
      )}
    </div>
  )
}

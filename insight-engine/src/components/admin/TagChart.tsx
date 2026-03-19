'use client'

import { BarChartBlock } from './ChartBlock'
import type { TagDistribution } from '@/types'

interface TagChartProps {
  distributions: TagDistribution[]
  filterKey?: string
  title: string
}

export function TagChart({ distributions, filterKey, title }: TagChartProps) {
  const filtered = filterKey
    ? distributions.filter((d) => d.tagKey === filterKey)
    : distributions

  const data = filtered.map((d) => ({
    label: filterKey ? d.tagValue : `${d.tagKey}: ${d.tagValue}`,
    count: d.count,
  }))

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-sm text-slate-400 mb-4">{title}</h3>
        <p className="text-slate-500 text-center py-8">尚無資料</p>
      </div>
    )
  }

  return <BarChartBlock title={title} data={data} />
}

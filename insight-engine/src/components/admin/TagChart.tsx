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
      <div className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-[20px] p-6">
        <h3 className="text-sm text-[#8a7ca8] mb-4">{title}</h3>
        <p className="text-[#3d3155]/60 text-center py-8">尚無資料</p>
      </div>
    )
  }

  return <BarChartBlock title={title} data={data} />
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface ResponseFiltersProps {
  currentStatus?: string
  currentSource?: string
}

export function ResponseFilters({
  currentStatus,
  currentSource,
}: ResponseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const slugMatch = pathname.match(/^\/insight-admin\/([^/]+)/)
  const basePath = slugMatch ? `/insight-admin/${slugMatch[1]}` : '/insight-admin'

  const applyFilters = useCallback(
    (status?: string, source?: string) => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (source) params.set('source', source)
      const qs = params.toString()
      router.push(`${basePath}/responses${qs ? `?${qs}` : ''}`)
    },
    [router, basePath]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentStatus ?? ''}
        onChange={(e) => applyFilters(e.target.value || undefined, currentSource)}
        className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        <option value="">所有狀態</option>
        <option value="completed">已完成</option>
        <option value="in_progress">進行中</option>
      </select>

      <input
        type="text"
        placeholder="依來源篩選 (utm_source)"
        defaultValue={currentSource ?? ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value.trim()
            applyFilters(currentStatus, val || undefined)
          }
        }}
        className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 w-52 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-500"
      />

      {(currentStatus || currentSource) && (
        <button
          onClick={() => applyFilters()}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          清除篩選
        </button>
      )}
    </div>
  )
}

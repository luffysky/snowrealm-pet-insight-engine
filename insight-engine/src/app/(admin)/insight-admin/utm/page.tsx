'use client'

import { useEffect, useState } from 'react'
import { BarChartBlock } from '@/components/admin'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import type { UtmSourceStats, UtmAnalytics } from '@/types'

export default function AdminUtmPage() {
  const { selectedSurveyId } = useAdminSurvey()
  const [analytics, setAnalytics] = useState<UtmAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSurveyId) return
    setLoading(true)
    fetch(`/api/admin/utm?surveyId=${selectedSurveyId}`)
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedSurveyId])

  if (loading || !analytics) return <p className="text-slate-400 animate-pulse">載入中…</p>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">來源分析</h1>

      <UtmSection title="流量來源（utm_source）" data={analytics.bySources} />
      <UtmSection title="媒介（utm_medium）" data={analytics.byMedium} />
      <UtmSection title="活動（utm_campaign）" data={analytics.byCampaign} />
    </div>
  )
}

function UtmSection({
  title,
  data,
}: {
  title: string
  data: UtmSourceStats[]
}) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-slate-500 text-sm">尚無資料</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BarChartBlock
        title={title}
        data={data.map((d) => ({ label: d.source, count: d.total }))}
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-6 py-3 text-slate-400 font-medium">
                來源
              </th>
              <th className="text-right px-6 py-3 text-slate-400 font-medium">
                總填寫
              </th>
              <th className="text-right px-6 py-3 text-slate-400 font-medium">
                已完成
              </th>
              <th className="text-right px-6 py-3 text-slate-400 font-medium">
                完成率
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.source}
                className="border-b border-slate-700/30 hover:bg-slate-700/20"
              >
                <td className="px-6 py-3 text-slate-300">{row.source}</td>
                <td className="px-6 py-3 text-right text-slate-300">
                  {row.total}
                </td>
                <td className="px-6 py-3 text-right text-slate-300">
                  {row.completed}
                </td>
                <td className="px-6 py-3 text-right text-t-accent">
                  {(row.completionRate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

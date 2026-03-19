'use client'

import { useEffect, useState } from 'react'
import type { FunnelStep } from '@/lib/stats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function FunnelPage() {
  const [data, setData] = useState<FunnelStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/funnel')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-400">載入中…</p>
  if (data.length === 0) return <p className="text-slate-400">尚無填答資料</p>

  const maxReached = Math.max(...data.map((d) => d.reached), 1)

  const chartData = data.map((d) => ({
    name: `Q${d.step + 1}`,
    reached: d.reached,
    dropOff: d.dropOff,
    label: d.questionContent.length > 12
      ? d.questionContent.slice(0, 12) + '…'
      : d.questionContent,
    fullLabel: d.questionContent,
    dropOffRate: d.dropOffRate,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">📉 漏斗分析</h1>
        <p className="text-slate-400 mt-1">每一題的到達人數與跳出率</p>
      </div>

      {/* 漏斗圖 */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">到達人數</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value, name) => [
                String(value),
                name === 'reached' ? '到達人數' : '跳出人數',
              ]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === String(label))
                return item?.fullLabel ?? String(label)
              }}
            />
            <Bar dataKey="reached" name="reached" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`rgba(59, 130, 246, ${0.3 + (entry.reached / maxReached) * 0.7})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 跳出率表格 */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">各題跳出率</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left py-2 px-3">題號</th>
              <th className="text-left py-2 px-3">題目內容</th>
              <th className="text-right py-2 px-3">到達</th>
              <th className="text-right py-2 px-3">跳出</th>
              <th className="text-right py-2 px-3">跳出率</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {data.map((d) => (
              <tr key={d.step} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-2 px-3 font-mono">Q{d.step + 1}</td>
                <td className="py-2 px-3 max-w-xs truncate">{d.questionContent}</td>
                <td className="py-2 px-3 text-right">{d.reached}</td>
                <td className="py-2 px-3 text-right">{d.dropOff}</td>
                <td className="py-2 px-3 text-right">
                  <span className={d.dropOffRate > 0.3 ? 'text-red-400 font-semibold' : ''}>
                    {(d.dropOffRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface DayCount {
  day: string
  count: number
}

interface TopTenant {
  tenantId: string
  name: string
  count: number
}

interface AnalyticsData {
  dailyActiveTenants: DayCount[]
  dailyResponses: DayCount[]
  dailyAiUsage: DayCount[]
  userGrowth: DayCount[]
  topTenants: TopTenant[]
}

const CHART_CONFIGS = [
  { key: 'dailyResponses' as const, label: '每日回覆數', color: '#34d399' },
  { key: 'dailyActiveTenants' as const, label: '每日活躍租戶', color: '#22d3ee' },
  { key: 'dailyAiUsage' as const, label: '每日 AI 用量', color: '#a78bfa' },
  { key: 'userGrowth' as const, label: '每日新增使用者', color: '#fbbf24' },
]

function formatDay(day: string): string {
  const d = new Date(day)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/super-admin/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入分析數據...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>
  if (!data) return null

  const maxTenantCount = Math.max(...(data.topTenants.map(t => t.count)), 1)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">分析儀表板</h1>
      <p className="text-sm text-white/40 -mt-4">過去 30 天趨勢</p>

      {/* 折線圖 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CHART_CONFIGS.map(({ key, label, color }) => {
          const chartData = data[key].map(d => ({
            day: formatDay(d.day),
            count: d.count,
          }))
          const total = data[key].reduce((s, d) => s + d.count, 0)

          return (
            <div
              key={key}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">{label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-white/50">
                  合計 {total.toLocaleString()}
                </span>
              </div>
              {chartData.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">尚無資料</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )
        })}
      </div>

      {/* 本月熱門租戶 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🏆 本月回覆數排行</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          {data.topTenants.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">本月尚無回覆資料</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-2">排名</th>
                  <th className="text-left px-4 py-2">租戶</th>
                  <th className="text-left px-4 py-2">回覆數</th>
                  <th className="text-left px-4 py-2 hidden sm:table-cell">佔比</th>
                </tr>
              </thead>
              <tbody>
                {data.topTenants.map((tenant, idx) => {
                  const pct = ((tenant.count / maxTenantCount) * 100).toFixed(0)
                  return (
                    <tr key={tenant.tenantId} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-2.5 text-white/50 font-mono w-12">
                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-white/80 font-medium">{tenant.name}</span>
                        <span className="text-white/30 text-xs ml-2 font-mono">{tenant.tenantId}</span>
                      </td>
                      <td className="px-4 py-2.5 text-amber-400 font-mono">
                        {tenant.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                            <div
                              className="bg-amber-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-white/30 text-xs w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

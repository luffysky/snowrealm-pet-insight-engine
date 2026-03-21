'use client'

import { useEffect, useState } from 'react'

interface PlatformStats {
  totalTenants: number
  totalUsers: number
  totalSurveys: number
  totalResponses: number
  todayResponses: number
  activeTenants30d: number
  topFeatures: { feature: string; count: number }[]
  recentTenants: { slug: string; name: string; plan: string; created_at: string; userCount: number; surveyCount: number }[]
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/super-admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入平台數據...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>
  if (!stats) return null

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">平台總覽</h1>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: '總租戶數', value: stats.totalTenants, color: 'text-cyan-400' },
          { label: '總使用者', value: stats.totalUsers, color: 'text-blue-400' },
          { label: '問卷總數', value: stats.totalSurveys, color: 'text-purple-400' },
          { label: '回覆總數', value: stats.totalResponses, color: 'text-emerald-400' },
          { label: '今日回覆', value: stats.todayResponses, color: 'text-amber-400' },
          { label: '30 天活躍租戶', value: stats.activeTenants30d, color: 'text-pink-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* 功能使用排行 */}
      {stats.topFeatures.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/90 mb-3">📈 功能使用排行</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-2">功能</th>
                  <th className="text-right px-4 py-2">使用次數</th>
                </tr>
              </thead>
              <tbody>
                {stats.topFeatures.map((f) => (
                  <tr key={f.feature} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/80">{f.feature}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400 font-mono">{f.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 最近租戶 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🏢 租戶列表</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">組織</th>
                <th className="text-left px-4 py-2">Slug</th>
                <th className="text-left px-4 py-2">方案</th>
                <th className="text-right px-4 py-2">用戶數</th>
                <th className="text-right px-4 py-2">問卷數</th>
                <th className="text-left px-4 py-2">建立時間</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTenants.map((t) => (
                <tr key={t.slug} className="border-b border-slate-800/50 last:border-0">
                  <td className="px-4 py-2.5 text-white/80 font-medium">{t.name}</td>
                  <td className="px-4 py-2.5 text-white/50 font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.plan === 'free' ? 'bg-slate-700 text-slate-300' :
                      t.plan === 'pro' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{t.plan}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-white/60">{t.userCount}</td>
                  <td className="px-4 py-2.5 text-right text-white/60">{t.surveyCount}</td>
                  <td className="px-4 py-2.5 text-white/40 text-xs">
                    {new Date(t.created_at).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

    </div>
  )
}

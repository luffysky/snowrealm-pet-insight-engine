'use client'

import { useEffect, useState } from 'react'

interface DailyData {
  date: string
  count: number
}

interface TenantUsage {
  slug: string
  name: string
  responseCount: number
  surveyCount: number
  aiCount: number
  notifCount: number
  lastResponseAt: string | null
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('zh-TW') } catch { return iso }
}

export default function SuperAdminUsagePage() {
  const [dailyResponses, setDailyResponses] = useState<DailyData[]>([])
  const [dailyRegistrations, setDailyRegistrations] = useState<DailyData[]>([])
  const [tenantUsage, setTenantUsage] = useState<TenantUsage[]>([])
  const [dbSize, setDbSize] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/super-admin/usage')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setDailyResponses(data.dailyResponses ?? [])
        setDailyRegistrations(data.dailyRegistrations ?? [])
        setTenantUsage(data.tenantUsage ?? [])
        setDbSize(data.dbSize ?? 'N/A')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入用量數據...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  // 計算 30 天總量
  const totalResponses30d = dailyResponses.reduce((sum, d) => sum + d.count, 0)
  const totalRegistrations30d = dailyRegistrations.reduce((sum, d) => sum + d.count, 0)
  const totalAiCalls = tenantUsage.reduce((sum, t) => sum + t.aiCount, 0)
  const totalNotifications = tenantUsage.reduce((sum, t) => sum + t.notifCount, 0)

  // 回覆趨勢 — 簡易文字圖表
  const maxResponseCount = Math.max(...dailyResponses.map(d => d.count), 1)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">📈 用量追蹤</h1>

      {/* 30 天綜合 KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: '30 天回覆', value: totalResponses30d, color: 'text-emerald-400' },
          { label: '30 天註冊', value: totalRegistrations30d, color: 'text-blue-400' },
          { label: 'AI 總呼叫', value: totalAiCalls, color: 'text-amber-400' },
          { label: '通知總發送', value: totalNotifications, color: 'text-pink-400' },
          { label: '資料庫大小', value: dbSize, color: 'text-purple-400', isString: true },
        ].map(kpi => (
          <div key={kpi.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-xl font-bold ${kpi.color}`}>
              {'isString' in kpi ? kpi.value : (kpi.value as number).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* 每日回覆趨勢 */}
      {dailyResponses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/90 mb-3">📊 每日回覆趨勢（最近 30 天）</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
            {dailyResponses.slice(-14).map(d => (
              <div key={d.date} className="flex items-center gap-3 text-xs">
                <span className="text-white/40 w-20 shrink-0 font-mono">{d.date.slice(5)}</span>
                <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${(d.count / maxResponseCount) * 100}%` }}
                  />
                </div>
                <span className="text-white/60 w-12 text-right font-mono">{d.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 每日註冊趨勢 */}
      {dailyRegistrations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/90 mb-3">👤 每日新註冊趨勢</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
            {dailyRegistrations.slice(-14).map(d => {
              const maxReg = Math.max(...dailyRegistrations.map(dd => dd.count), 1)
              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="text-white/40 w-20 shrink-0 font-mono">{d.date.slice(5)}</span>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(d.count / maxReg) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/60 w-12 text-right font-mono">{d.count}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 各租戶用量排行 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🏢 各租戶用量排行</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-2">組織</th>
                  <th className="text-right px-4 py-2">回覆數</th>
                  <th className="text-right px-4 py-2">問卷數</th>
                  <th className="text-right px-4 py-2">AI 呼叫</th>
                  <th className="text-right px-4 py-2">通知發送</th>
                  <th className="text-left px-4 py-2">最後回覆</th>
                </tr>
              </thead>
              <tbody>
                {tenantUsage.map(t => (
                  <tr key={t.slug} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="text-white/80 font-medium">{t.name}</span>
                      <span className="text-white/30 font-mono text-xs ml-2">{t.slug}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-mono">{t.responseCount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-purple-400 font-mono">{t.surveyCount}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400 font-mono">{t.aiCount}</td>
                    <td className="px-4 py-2.5 text-right text-pink-400 font-mono">{t.notifCount}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">
                      {t.lastResponseAt ? formatDate(t.lastResponseAt) : '—'}
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

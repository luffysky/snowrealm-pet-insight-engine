'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface PlatformStats {
  totalTenants: number; totalUsers: number; totalSurveys: number
  totalResponses: number; todayResponses: number; activeTenants30d: number
  topFeatures: { feature: string; count: number }[]
  recentTenants: { slug: string; name: string; plan: string; created_at: string; userCount: number; surveyCount: number }[]
}

interface Alert { id: string; level: 'info' | 'warning' | 'critical'; title: string; details: string | null; created_at: string }
interface FeedEntry { id: string; user_id: string | null; action: string; category: string; created_at: string; nickname: string | null; display_name: string | null }
interface Revenue { today_total: number; yesterday_total: number; change_pct: number }

const ALERT_CLS = {
  critical: 'border-red-500/50 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  info: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sseRef = useRef<EventSource | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/super-admin/stats').then(r => r.json()),
      fetch('/api/super-admin/alerts').then(r => r.json()).catch(() => ({ alerts: [] })),
      fetch('/api/super-admin/live-feed?limit=10').then(r => r.json()).catch(() => ({ entries: [] })),
      fetch('/api/super-admin/revenue/today').then(r => r.json()).catch(() => null),
    ]).then(([s, a, f, rev]) => {
      if (s.error) throw new Error(s.error)
      setStats(s)
      setAlerts(a.alerts ?? [])
      setFeed(f.entries ?? [])
      setRevenue(rev)
    }).catch(e => setError(e.message)).finally(() => setLoading(false))

    // SSE for live feed updates
    const es = new EventSource('/api/super-admin/live-feed/stream')
    sseRef.current = es
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'ping') return
        if (Array.isArray(data) && data.length > 0) {
          setFeed(prev => [...data.reverse(), ...prev].slice(0, 10))
        }
      } catch { /* ignore */ }
    }
    return () => es.close()
  }, [])

  async function dismissAlert(id: string) {
    await fetch('/api/super-admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入平台數據...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>
  if (!stats) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">平台總覽</h1>
      </div>

      {/* 警報中心 */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">🚨 警報中心</h2>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border ${ALERT_CLS[a.level]}`}>
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  {a.details && <p className="text-xs opacity-70 mt-0.5">{a.details}</p>}
                </div>
                <button onClick={() => dismissAlert(a.id)} className="text-xs opacity-50 hover:opacity-100 shrink-0">✕ 確認</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: '總租戶', value: stats.totalTenants, color: 'text-cyan-400' },
          { label: '總用戶', value: stats.totalUsers, color: 'text-blue-400' },
          { label: '問卷數', value: stats.totalSurveys, color: 'text-purple-400' },
          { label: '回覆總數', value: stats.totalResponses, color: 'text-emerald-400' },
          { label: '今日回覆', value: stats.todayResponses, color: 'text-amber-400' },
          { label: '30日活躍', value: stats.activeTenants30d, color: 'text-pink-400' },
          {
            label: '今日營收',
            value: revenue ? `NT$${revenue.today_total.toLocaleString()}` : '—',
            color: revenue && revenue.change_pct > 0 ? 'text-emerald-400' : 'text-red-400',
          },
          {
            label: '待處理警報',
            value: alerts.length,
            color: alerts.length > 0 ? 'text-red-400' : 'text-white/30',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${kpi.color}`}>{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
            <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 即時活動流 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/80">⚡ 即時活動流</h2>
            <Link href="/snowrealm-insight-ctrl/live-feed" className="text-xs text-cyan-400 hover:underline">查看完整 →</Link>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            {feed.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-6">暫無活動</p>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {feed.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                    <span className="text-xs text-white/30 font-mono w-12 shrink-0">{formatTime(entry.created_at)}</span>
                    <span className="text-sm text-white/60 flex-1 truncate">
                      <span className="text-white/80">{entry.nickname || entry.display_name || '系統'}</span>
                      {' '}{entry.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 功能使用排行 */}
        <section>
          <h2 className="text-sm font-semibold text-white/80 mb-3">📈 功能使用排行</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-2">功能</th>
                  <th className="text-right px-4 py-2">次數</th>
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
      </div>

      {/* 租戶列表 */}
      <section>
        <h2 className="text-sm font-semibold text-white/80 mb-3">🏢 租戶列表</h2>
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
                  <tr key={t.slug} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
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
                    <td className="px-4 py-2.5 text-white/40 text-xs">{new Date(t.created_at).toLocaleDateString('zh-TW')}</td>
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

'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Summary { month_total: number; total_calls: number; budget: number; pct: number }
interface DailyItem { date: string; cost: number; calls: number }
interface ModelItem { model: string; cost: number; calls: number }
interface TaskItem { task: string; cost: number; calls: number }
interface ExpensiveConv { id: string; user_id: string | null; model: string; intent_type: string | null; total_cost_usd: number; created_at: string; nickname: string | null }

const PIE_COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#f87171', '#60a5fa']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = ({ name, percent }: any) => `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`

function formatUSD(n: number) { return `$${n.toFixed(4)}` }
function formatUSDShort(n: number) { return `$${n.toFixed(2)}` }

export default function AiCostPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily, setDaily] = useState<DailyItem[]>([])
  const [byModel, setByModel] = useState<ModelItem[]>([])
  const [byTask, setByTask] = useState<TaskItem[]>([])
  const [topExpensive, setTopExpensive] = useState<ExpensiveConv[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/super-admin/ai-cost/summary').then(r => r.json()),
      fetch('/api/super-admin/ai-cost/daily').then(r => r.json()),
      fetch('/api/super-admin/ai-cost/by-model').then(r => r.json()),
      fetch('/api/super-admin/ai-cost/by-task').then(r => r.json()),
      fetch('/api/super-admin/ai-cost/top-expensive').then(r => r.json()),
    ]).then(([s, d, m, t, e]) => {
      setSummary(s)
      setDaily(d.data ?? [])
      setByModel(m.data ?? [])
      setByTask(t.data ?? [])
      setTopExpensive(e.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入 AI 成本數據...</p>

  const pct = summary?.pct ?? 0
  const barColor = pct < 50 ? '#34d399' : pct < 80 ? '#f59e0b' : pct < 90 ? '#f97316' : '#ef4444'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🧠 AI 成本監控</h1>

      {/* 本月摘要 */}
      {summary && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-2">本月累計成本</p>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-4xl font-bold text-white">{formatUSDShort(summary.month_total)}</p>
            <p className="text-white/40 text-sm mb-1">/ {formatUSDShort(summary.budget)} 預算</p>
            <p className="text-white/40 text-sm mb-1">({summary.total_calls.toLocaleString()} 次呼叫)</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: barColor }}>{pct.toFixed(1)}% 已使用</p>
        </div>
      )}

      {/* 日趨勢 */}
      {daily.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-4">📅 近 30 天日成本</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={daily}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(2)}`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(v: unknown) => [formatUSD(Number(v)), '成本']}
              />
              <Line type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 模型 + 任務佔比 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {byModel.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/80 mb-4">🤖 模型成本佔比</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byModel} dataKey="cost" nameKey="model" cx="50%" cy="50%" outerRadius={70} label={renderPieLabel}>
                  {byModel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatUSD(Number(v))} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {byTask.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/80 mb-4">📋 任務類型佔比</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byTask} dataKey="cost" nameKey="task" cx="50%" cy="50%" outerRadius={70} label={renderPieLabel}>
                  {byTask.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatUSD(Number(v))} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top 10 最貴 */}
      {topExpensive.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white/80">💸 最貴的前 10 次對話</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">使用者</th>
                <th className="text-left px-4 py-2">意圖</th>
                <th className="text-left px-4 py-2">模型</th>
                <th className="text-right px-4 py-2">成本</th>
                <th className="text-left px-4 py-2">時間</th>
              </tr></thead>
              <tbody>
                {topExpensive.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-white/70">{c.nickname || c.user_id?.slice(0, 8) || '—'}</td>
                    <td className="px-4 py-2.5 text-white/50 text-xs">{c.intent_type ?? '—'}</td>
                    <td className="px-4 py-2.5 text-cyan-400 text-xs font-mono">{c.model}</td>
                    <td className="px-4 py-2.5 text-right text-red-400 font-bold">{formatUSD(c.total_cost_usd)}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{new Date(c.created_at).toLocaleDateString('zh-TW')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!summary && <p className="text-center text-white/30 py-8">尚無 AI 成本記錄</p>}
    </div>
  )
}

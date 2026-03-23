'use client'

import { useEffect, useState } from 'react'

interface HealthData {
  dbSizeBytes: number
  tableCounts: Record<string, number>
  envStatus: Record<string, boolean>
  envLegend?: string[]
  checkedAt: string
}

const TABLE_LABELS: Record<string, string> = {
  tenants: '租戶',
  admin_users: '管理員',
  surveys: '問卷',
  responses: '回覆',
  ai_usage_logs: 'AI 用量紀錄',
  support_tickets: '客服工單',
  audit_logs: '審計日誌',
  subscriptions: '訂閱',
}

function formatDbSize(bytes: number): string {
  const GB = 1024 * 1024 * 1024
  const MB = 1024 * 1024
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`
  return `${(bytes / MB).toFixed(2)} MB`
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/super-admin/health')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入系統健康狀態...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>
  if (!data) return null

  const tableEntries = Object.entries(data.tableCounts)
  const envEntries = Object.entries(data.envStatus)
  const totalRows = tableEntries.reduce((sum, [, count]) => sum + count, 0)
  const envSetCount = envEntries.filter(([, v]) => v).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">系統健康狀態</h1>
        <p className="text-xs text-white/30">
          檢查時間：{new Date(data.checkedAt).toLocaleString('zh-TW')}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-cyan-400">{formatDbSize(data.dbSizeBytes)}</p>
          <p className="text-xs text-white/40 mt-1">資料庫大小</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{totalRows.toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-1">資料列總計</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-amber-400">{envSetCount} / {envEntries.length}</p>
          <p className="text-xs text-white/40 mt-1">環境變數已設定</p>
        </div>
      </div>

      {/* 表格行數 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">📊 資料表行數</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">資料表</th>
                <th className="text-right px-4 py-2">行數</th>
              </tr>
            </thead>
            <tbody>
              {tableEntries.map(([table, count]) => (
                <tr key={table} className="border-b border-slate-800/50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="text-white/80">{TABLE_LABELS[table] ?? table}</span>
                    <span className="text-white/30 text-xs ml-2 font-mono">{table}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-400 font-mono">
                    {count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 環境變數狀態 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🔑 環境變數狀態</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            {[
              envEntries.slice(0, Math.ceil(envEntries.length / 2)),
              envEntries.slice(Math.ceil(envEntries.length / 2)),
            ].map((column, colIdx) => (
              <div key={colIdx} className="divide-y divide-slate-800/50">
                {column.map(([key, isSet]) => (
                  <div key={key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-white/70 text-sm font-mono truncate mr-3">{key}</span>
                    {isSet ? (
                      <span className="text-emerald-400 text-sm shrink-0">✓ 已設定</span>
                    ) : (
                      <span className="text-red-400 text-sm shrink-0">✗ 未設定</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {data.envLegend && data.envLegend.length > 0 && (
          <div className="mt-3 space-y-1.5 text-xs text-white/45 px-1">
            <p className="font-medium text-white/55">說明</p>
            <ul className="list-disc pl-4 space-y-1">
              {data.envLegend.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

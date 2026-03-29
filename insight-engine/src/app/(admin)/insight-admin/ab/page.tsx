'use client'

import { useEffect, useState } from 'react'

interface VariantStats {
  surveyId: string
  slug: string
  title: string
  total: number
  completed: number
  completionRate: number
}

export default function ABPage() {
  const [groups, setGroups] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [stats, setStats] = useState<VariantStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ab')
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups ?? [])
        if (data.groups?.length > 0) setSelectedGroup(data.groups[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedGroup) return
    setLoading(true)
    fetch(`/api/admin/ab?group=${encodeURIComponent(selectedGroup)}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedGroup])

  if (loading && groups.length === 0) return <p className="text-[#8a7ca8]">載入中…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🔬 A/B 版本比較</h1>
        <p className="text-[#8a7ca8] mt-1">
          在「問卷管理」中設定 variant_group，同一群組的問卷會隨機分流
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-sm rounded-[20px] border border-[#b8a9e8]/20 p-8 text-center text-[#8a7ca8]">
          <p className="text-lg mb-2">尚無 A/B 群組</p>
          <p className="text-sm">
            前往「問卷管理」→ 編輯問卷 → 在 Variant Group 欄位設定相同的群組名稱即可
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm text-[#8a7ca8] mb-1">選擇群組</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg px-3 py-2 text-sm"
            >
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-[#8a7ca8]">載入中…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((s) => {
                const best = stats.reduce((a, b) =>
                  b.completionRate > a.completionRate ? b : a
                )
                const isBest = s.surveyId === best.surveyId && stats.length > 1
                return (
                  <div
                    key={s.surveyId}
                    className={`rounded-xl border p-6 ${
                      isBest
                        ? 'bg-emerald-900/30 border-emerald-700'
                        : 'bg-white/60 border-[#b8a9e8]/20'
                    }`}
                  >
                    {isBest && (
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded mb-2 inline-block">
                        🏆 Winner
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-[#3d3155]">{s.title}</h3>
                    <p className="text-[#8a7ca8] text-sm mb-4 font-mono">{s.slug}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-[#3d3155]">{s.total}</div>
                        <div className="text-xs text-[#8a7ca8]">總填答</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-[#3d3155]">{s.completed}</div>
                        <div className="text-xs text-[#8a7ca8]">完成</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-[#3d3155]">
                          {(s.completionRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-[#8a7ca8]">完成率</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

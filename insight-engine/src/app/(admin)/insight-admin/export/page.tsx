'use client'

import { useState, useEffect } from 'react'

interface SurveyOption { id: string; title: string }

const EXPORT_TYPES = [
  { key: 'responses', icon: '📝', title: '填答資料', desc: '匯出所有問卷回覆的完整資料，包含答案、標籤、UTM 參數' },
  { key: 'surveys', icon: '📋', title: '問卷列表', desc: '匯出所有問卷的基本資料、題數與回覆數' },
  { key: 'tags', icon: '🏷️', title: '標籤統計', desc: '匯出所有標籤及對應的回覆數量' },
]

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [surveys, setSurveys] = useState<SurveyOption[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState('')

  useEffect(() => {
    fetch('/api/admin/surveys')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setSurveys(d.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title })))
      })
      .catch(() => {})
  }, [])

  async function handleExport(type: string) {
    setLoading(type)
    try {
      const params = new URLSearchParams({ type, format: 'csv' })
      if (type === 'responses' && selectedSurvey) params.set('surveyId', selectedSurvey)
      const res = await fetch(`/api/admin/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_export.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('匯出失敗，請稍後再試')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">📦 資料匯出中心</h1>
        <p className="text-slate-400 mt-1 text-sm">匯出問卷資料為 CSV 格式，可用 Excel 開啟</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXPORT_TYPES.map(et => (
          <div key={et.key} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="text-3xl">{et.icon}</div>
            <h3 className="text-lg font-semibold text-white">{et.title}</h3>
            <p className="text-sm text-white/50">{et.desc}</p>

            {et.key === 'responses' && (
              <select
                value={selectedSurvey}
                onChange={e => setSelectedSurvey(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="">全部問卷</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => handleExport(et.key)}
              disabled={loading === et.key}
              className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              {loading === et.key ? '匯出中...' : '下載 CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CrossTabResult } from '@/lib/stats'
import type { QuestionStats } from '@/types'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'

interface QuestionItem { key: string; content: string }

export default function CrossTabPage() {
  const { selectedSurveyId } = useAdminSurvey()
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [keyA, setKeyA] = useState('')
  const [keyB, setKeyB] = useState('')
  const [result, setResult] = useState<CrossTabResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedSurveyId) return
    fetch(`/api/admin/questions?surveyId=${selectedSurveyId}`)
      .then((r) => r.json())
      .then((data: QuestionStats[]) => {
        const items = data.map((q) => ({ key: q.questionKey, content: q.questionContent }))
        setQuestions(items)
        if (items.length >= 2) {
          setKeyA(items[0].key)
          setKeyB(items[1].key)
        }
      })
      .catch(console.error)
  }, [selectedSurveyId])

  const fetchCrossTab = useCallback(() => {
    if (!keyA || !keyB || keyA === keyB) return
    setLoading(true)
    const q = new URLSearchParams({ a: keyA, b: keyB })
    if (selectedSurveyId) q.set('surveyId', selectedSurveyId)
    fetch(`/api/admin/crosstab?${q}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [keyA, keyB, selectedSurveyId])

  useEffect(() => {
    if (keyA && keyB && keyA !== keyB) fetchCrossTab()
  }, [keyA, keyB, fetchCrossTab])

  const questionLabel = (key: string) => {
    const q = questions.find((q) => q.key === key)
    return q ? `${key}: ${q.content.slice(0, 20)}` : key
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🔀 交叉分析</h1>
        <p className="text-[#8a7ca8] mt-1">選擇兩題，查看答案組合分佈</p>
      </div>

      {/* 題目選擇器 */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-[#8a7ca8] mb-1">題目 A（列）</label>
          <select
            value={keyA}
            onChange={(e) => setKeyA(e.target.value)}
            className="bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg px-3 py-2 text-sm"
          >
            {questions.map((q) => (
              <option key={q.key} value={q.key}>
                {q.key}: {q.content.slice(0, 30)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#8a7ca8] mb-1">題目 B（欄）</label>
          <select
            value={keyB}
            onChange={(e) => setKeyB(e.target.value)}
            className="bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] rounded-lg px-3 py-2 text-sm"
          >
            {questions.map((q) => (
              <option key={q.key} value={q.key}>
                {q.key}: {q.content.slice(0, 30)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {keyA === keyB && (
        <p className="text-amber-400 text-sm">⚠️ 請選擇兩道不同的題目</p>
      )}

      {loading && <p className="text-[#8a7ca8]">分析中…</p>}

      {/* 交叉表格 */}
      {result && !loading && (
        <div className="bg-white/40 backdrop-blur-sm rounded-[20px] border border-[#b8a9e8]/25 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-[#3d3155] mb-4">
            {questionLabel(result.questionA)} × {questionLabel(result.questionB)}
          </h2>
          <table className="text-sm min-w-full">
            <thead>
              <tr className="border-b border-[#b8a9e8]/20">
                <th className="text-left py-2 px-3 text-[#8a7ca8]">A ＼ B</th>
                {result.colLabels.map((col) => (
                  <th key={col} className="text-center py-2 px-3 text-[#8a7ca8] max-w-30 truncate">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {result.matrix.map((row) => (
                <tr key={row.rowLabel} className="border-b border-[#b8a9e8]/25 hover:bg-white/35 backdrop-blur-sm">
                  <td className="py-2 px-3 font-medium text-[#3d3155] max-w-40 truncate">
                    {row.rowLabel}
                  </td>
                  {row.columns.map((cell) => {
                    const maxCount = Math.max(
                      ...result.matrix.flatMap((r) => r.columns.map((c) => c.count)),
                      1
                    )
                    const intensity = cell.count / maxCount
                    return (
                      <td
                        key={cell.colLabel}
                        className="py-2 px-3 text-center font-mono"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${intensity * 0.4})`,
                        }}
                      >
                        {cell.count}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

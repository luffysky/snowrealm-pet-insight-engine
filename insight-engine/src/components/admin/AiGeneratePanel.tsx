'use client'

import { useState } from 'react'

interface GeneratedQuestion {
  key: string
  type: 'single' | 'multiple' | 'text'
  content: string
  options: { label: string; value: string }[]
  isRequired: boolean
  route: string
}

interface AiGeneratePanelProps {
  surveyId: string
  existingCount: number
  onDone: () => void
  onCancel: () => void
}

export function AiGeneratePanel({ surveyId, existingCount, onDone, onCancel }: AiGeneratePanelProps) {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [questionCount, setQuestionCount] = useState(8)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<GeneratedQuestion[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [inserting, setInserting] = useState(false)
  const [meta, setMeta] = useState<{ provider?: string; model?: string; isFree?: boolean } | null>(null)

  async function handleGenerate() {
    if (!topic.trim()) { setError('請輸入問卷主題'); return }
    setGenerating(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/api/admin/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          questionCount,
          language: '繁體中文',
          action: 'generate',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'AI 生成失敗')
        return
      }

      setResults(data.questions)
      setMeta(data.meta)
      // 預設全選
      setSelected(new Set(data.questions.map((_: unknown, i: number) => i)))
    } catch {
      setError('AI 生成失敗，請稍後再試')
    } finally {
      setGenerating(false)
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleAll() {
    if (!results) return
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map((_, i) => i)))
    }
  }

  async function handleInsert() {
    if (!results || selected.size === 0) return
    setInserting(true)
    setError('')

    try {
      const selectedQuestions = results.filter((_, i) => selected.has(i))
      let order = existingCount

      for (const q of selectedQuestions) {
        await fetch(`/api/admin/surveys/${surveyId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `q${order + 1}`,
            type: q.type,
            content: q.content,
            options: q.options,
            order_index: order,
            is_required: q.isRequired,
            route: q.route || 'all',
          }),
        })
        order++
      }

      onDone()
    } catch {
      setError('插入題目失敗')
    } finally {
      setInserting(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50'

  return (
    <div className="bg-slate-800/80 border border-cyan-500/20 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🤖 AI 生成題目
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer">✕</button>
      </div>

      {/* Step 1: Input */}
      {!results && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">問卷主題 *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例：寵物飼主生活習慣調查"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">詳細描述（選填）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="說明問卷目的、想了解的面向..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">目標受眾（選填）</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="例：18-35 歲寵物飼主"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">題數</label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(15, parseInt(e.target.value) || 8)))}
                min={1}
                max={15}
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-all cursor-pointer"
            >
              {generating ? '🔄 AI 生成中...' : '✨ 開始生成'}
            </button>
            <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Select */}
      {results && (
        <div className="space-y-4">
          {meta && (
            <p className="text-xs text-slate-500">
              模型：{meta.provider}/{meta.model} {meta.isFree ? '(免費額度)' : ''}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              生成 <span className="text-cyan-400 font-medium">{results.length}</span> 題，已選
              <span className="text-cyan-400 font-medium"> {selected.size}</span> 題
            </p>
            <button onClick={toggleAll} className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">
              {selected.size === results.length ? '取消全選' : '全選'}
            </button>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {results.map((q, i) => (
              <div
                key={i}
                onClick={() => toggleSelect(i)}
                className={`rounded-xl p-3 border cursor-pointer transition-colors ${
                  selected.has(i)
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900/50 border-slate-700/50 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30 font-mono">{q.key}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        q.type === 'single' ? 'bg-blue-500/20 text-blue-400'
                        : q.type === 'multiple' ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{q.type}</span>
                      {q.isRequired && <span className="text-xs text-red-400/60">必填</span>}
                    </div>
                    <p className="text-sm text-white/80">{q.content}</p>
                    {q.options.length > 0 && (
                      <p className="text-xs text-white/40">
                        選項：{q.options.map((o) => o.label).join('、')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleInsert}
              disabled={inserting || selected.size === 0}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              {inserting ? '插入中...' : `插入 ${selected.size} 題到問卷`}
            </button>
            <button
              onClick={() => { setResults(null); setSelected(new Set()) }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer"
            >
              重新生成
            </button>
            <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-300 cursor-pointer">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

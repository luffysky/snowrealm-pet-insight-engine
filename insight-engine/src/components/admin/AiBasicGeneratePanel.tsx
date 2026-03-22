'use client'

import { useState } from 'react'

export interface GeneratedMeta {
  title: string
  subtitle: string
  coverTitle: string
  coverSubtitle: string
  startButtonText: string
  doneTitle: string
  doneSubtitle: string
  ogTitle: string
  ogDescription: string
}

interface AiBasicGeneratePanelProps {
  onDone: (meta: GeneratedMeta) => void
  onCancel: () => void
}

export function AiBasicGeneratePanel({ onDone, onCancel }: AiBasicGeneratePanelProps) {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [metaInfo, setMetaInfo] = useState<{ provider?: string; model?: string; isFree?: boolean } | null>(null)

  async function handleGenerate() {
    if (!topic.trim()) { setError('請輸入問卷主題'); return }
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/ai-generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          language: '繁體中文',
          action: 'generate_meta',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) {
          setError(data.error + ' (請至「AI 與配額」設定您的 API Key)')
        } else {
          setError(data.error || 'AI 生成失敗')
        }
        return
      }

      setMetaInfo(data.meta)
      onDone(data.metaSettings as GeneratedMeta)
    } catch {
      setError('AI 生成失敗，請稍後再試')
    } finally {
      setGenerating(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50'

  return (
    <div className="bg-slate-800/80 border border-cyan-500/20 rounded-xl p-6 space-y-5 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🤖 AI 生成文案設定
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">問卷主題 *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例：2025 寵物飲食習慣大調查"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">詳細描述（選填）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="說明問卷目的、想了解的面向..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">目標受眾（選填）</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="例：18-35 歲貓奴"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {metaInfo && (
          <p className="text-xs text-slate-500">
            模型：{metaInfo.provider}/{metaInfo.model} {metaInfo.isFree ? '(免費額度)' : ''}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-all cursor-pointer"
          >
            {generating ? '🔄 AI 思考中...' : '✨ 自動生成問卷文案'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer">
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

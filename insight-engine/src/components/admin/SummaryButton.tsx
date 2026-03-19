'use client'

import { useState } from 'react'

export default function SummaryButton() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setCopied(false)
    try {
      const res = await fetch('/api/admin/summary')
      const data = await res.json()
      setText(data.text ?? '')
    } catch {
      setText('❌ 產生摘要失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? '產生中…' : '📋 產生摘要報告'}
      </button>

      {text && (
        <div className="mt-4 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">自動摘要</span>
            <button
              onClick={handleCopy}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors"
            >
              {copied ? '✅ 已複製' : '📎 複製'}
            </button>
          </div>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

export default function SummaryButton({ surveyId }: { surveyId?: string | null }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setCopied(false)
    try {
      const url = surveyId ? `/api/admin/summary?surveyId=${surveyId}` : '/api/admin/summary'
      const res = await fetch(url)
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
        className="bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(184,169,232,0.35)] transition-all"
      >
        {loading ? '產生中…' : '📋 產生摘要報告'}
      </button>

      {text && (
        <div className="mt-4 rounded-[16px] border border-[#b8a9e8]/25 bg-white/50 backdrop-blur-sm p-4 shadow-[0_4px_16px_rgba(184,169,232,0.10)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8a7ca8] font-medium">自動摘要</span>
            <button
              onClick={handleCopy}
              className="text-xs bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] px-3 py-1 rounded-full transition-colors"
            >
              {copied ? '✅ 已複製' : '📎 複製'}
            </button>
          </div>
          <pre className="text-sm text-[#3d3155] whitespace-pre-wrap leading-relaxed">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}

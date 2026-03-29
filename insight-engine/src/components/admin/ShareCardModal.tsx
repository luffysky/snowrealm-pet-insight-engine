'use client'

import { useState } from 'react'
import type { InsightReport } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'
import { ShareCard } from './ShareCard'

interface ShareCardModalProps {
  open: boolean
  onClose: () => void
  reportType: 'data' | 'story'
  report: InsightReport | StoryInsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  industry?: string
  createdAt: string
  onUnshare?: () => void
}

export function ShareCardModal({
  open,
  onClose,
  reportType,
  report,
  surveyTitle,
  shareUrl,
  theme,
  industry,
  createdAt,
  onUnshare,
}: ShareCardModalProps) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/60 border border-[#b8a9e8]/20 rounded-[20px] p-6 w-full max-w-lg space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#3d3155]">📤 分享報告</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a7ca8] hover:text-[#3d3155] transition-colors cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex justify-center overflow-x-auto">
          <ShareCard
            reportType={reportType}
            report={report}
            surveyTitle={surveyTitle}
            shareUrl={shareUrl}
            theme={theme}
            industry={industry}
            createdAt={createdAt}
          />
        </div>

        {/* URL section */}
        <div className="space-y-2">
          <p className="text-xs text-[#8a7ca8]">公開連結</p>
          <div className="flex items-center gap-2 bg-white/50 border border-[#b8a9e8]/20 rounded-xl px-3 py-2">
            <span className="flex-1 text-sm text-[#3d3155] truncate font-mono">{shareUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
            >
              {copied ? '✓ 已複製' : '複製'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-sm font-medium px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
          >
            💬 分享到 LINE
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-medium px-4 py-2 bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] border border-[#b8a9e8]/25 rounded-xl transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>

        {/* Unshare */}
        {onUnshare && (
          <div className="border-t border-[#b8a9e8]/20 pt-4">
            <button
              type="button"
              onClick={onUnshare}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              關閉公開分享
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

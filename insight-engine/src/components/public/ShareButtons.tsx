'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  url: string
  title: string
  className?: string
  onShared?: (earned: number) => void  // 分享後回呼（Z幣獎勵）
}

/** 呼叫後端記錄分享並領取 Z幣（非必須成功） */
async function recordShareEarn(): Promise<number> {
  try {
    const res = await fetch('/api/zcoin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'earn', amount: 5, reason: 'share' }),
    })
    if (res.ok) return 5
  } catch { /* 靜默失敗 */ }
  return 0
}

export function ShareButtons({ url, title, className = '', onShared }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  async function handleShareLine() {
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    const earned = await recordShareEarn()
    if (earned > 0) onShared?.(earned)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      const earned = await recordShareEarn()
      if (earned > 0) onShared?.(earned)
    } catch {
      // 瀏覽器不支援 clipboard API — 靜默失敗
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {/* 分享到 LINE */}
      <button
        type="button"
        onClick={handleShareLine}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-[#00B900]/15 border border-[#00B900]/30 text-[#00B900] hover:bg-[#00B900]/25 transition-colors cursor-pointer"
      >
        <span>💬</span>
        分享到 LINE
      </button>

      {/* 複製連結 */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      >
        <span>{copied ? '✅' : '📋'}</span>
        {copied ? '已複製！' : '複製連結'}
      </button>
    </div>
  )
}

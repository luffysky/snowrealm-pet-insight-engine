'use client'

import { useState } from 'react'

interface Props {
  title: string
  summary: string
  author: string
  url: string
}

export default function ShareArticleButton({ title, summary, author, url }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const lineShare = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/80 hover:border-white/20 transition-all"
      >
        <span>🔗</span>
        <span>分享文章</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-white/12 rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Preview card */}
            <div className="p-6 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-slate-900/0 border-b border-white/8">
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/8 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">✍️</div>
                  <span className="text-xs text-white/40">{author}</span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{title}</h3>
                {summary && (
                  <p className="text-xs text-white/45 leading-relaxed line-clamp-3">{summary}</p>
                )}
                <p className="text-[10px] text-white/20">{new URL(url).hostname}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 space-y-3">
              <h4 className="text-sm font-medium text-white/70 mb-4">分享到</h4>
              <a
                href={lineShare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#06C755]/15 border border-[#06C755]/25 text-[#06C755] text-sm font-medium hover:bg-[#06C755]/25 transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>分享到 LINE</span>
              </a>
              <button
                onClick={copyLink}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/65 text-sm hover:bg-white/8 transition-colors"
              >
                <span className="text-xl">{copied ? '✅' : '🔗'}</span>
                <span>{copied ? '已複製！' : '複製連結'}</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full text-xs text-white/25 py-2 hover:text-white/50 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

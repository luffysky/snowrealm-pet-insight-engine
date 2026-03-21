'use client'

import { useEffect, useRef, useCallback } from 'react'

export function ClickTrackLinks() {
  const responseId = useRef<string | null>(null)

  useEffect(() => {
    responseId.current = sessionStorage.getItem('lastResponseId')
  }, [])

  const trackClick = useCallback((eventType: string) => {
    const rid = responseId.current
    if (!rid) return
    fetch('/api/surveys/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId: rid, eventType }),
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-3">
      <a
        href="https://line.me/R/ti/p/@474iwlht"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('line_friend')}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#06C755] hover:bg-[#05b54e] text-white font-medium rounded-2xl transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 2C6.48 2 2 5.93 2 10.66c0 3.2 2.14 5.98 5.33 7.36-.07.63-.44 2.34-.5 2.7 0 0-.01.08.04.11.05.03.11.01.11.01.15-.02 1.76-1.16 2.57-1.7.78.11 1.59.17 2.45.17 5.52 0 10-3.93 10-8.66C22 5.93 17.52 2 12 2z"/>
        </svg>
        加入毛行天下 LINE 好友
      </a>
      <a
        href="https://www.instagram.com/snowrealm.pet?igsh=Y2x1cTRiM3N3NGpw"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('instagram')}
        className="inline-block w-full px-6 py-3.5 bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 text-white/80 rounded-2xl hover:bg-white/10 transition-colors"
      >
        關注毛行天下 Instagram
      </a>
      <p className="text-sm text-white/30">
        等待平台上線，我們會在第一時間通知你 ✨
      </p>
    </div>
  )
}

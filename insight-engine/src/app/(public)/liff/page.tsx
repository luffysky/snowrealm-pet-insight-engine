'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /liff — LIFF 入口頁面
 * 在 LINE 內開啟時自動取得 userId，綁定後導向問卷
 */
export default function LiffPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID
    if (!liffId) {
      // 沒有設定 LIFF ID，直接導向一般問卷
      router.replace('/survey')
      return
    }

    let cancelled = false

    async function initLiff() {
      try {
        // 動態載入 LIFF SDK
        const liff = (await import('@line/liff')).default
        await liff.init({ liffId: liffId! })

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }

        const profile = await liff.getProfile()

        // 綁定 LINE userId
        const responseId = sessionStorage.getItem('lastResponseId')
        await fetch('/api/line/liff-bind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: profile.userId,
            displayName: profile.displayName,
            responseId: responseId ?? undefined,
          }),
        })

        // 儲存 userId 供後續使用
        sessionStorage.setItem('lineUserId', profile.userId)

        if (!cancelled) {
          router.replace('/survey')
        }
      } catch (err) {
        console.error('[LIFF] init error:', err)
        if (!cancelled) {
          // LIFF 初始化失敗，fallback 到一般問卷
          router.replace('/survey')
        }
      }
    }

    initLiff()
    return () => { cancelled = true }
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/60">載入中…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-pulse">🐾</div>
        <p className="text-white/60">正在連接 LINE 帳號…</p>
      </div>
    </div>
  )
}

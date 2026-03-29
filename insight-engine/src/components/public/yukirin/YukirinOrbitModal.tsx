'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

const YukirinScene = dynamic(() => import('./YukirinScene'), { ssr: false })

export default function YukirinOrbitModal({ onClose }: { onClose: () => void }) {
  // ESC 關閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-[#0c0918]/80 backdrop-blur-lg"
        onClick={onClose}
      />

      {/* 場景全螢幕 */}
      <div className="absolute inset-0">
        <YukirinScene
          cameraMode="fullBody"
          mood="happy"
          showBackground
          allowOrbit
          className="w-full h-full"
        />
      </div>

      {/* UI 疊層（不擋 pointer events 到場景） */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 頂部：名字 + 關閉 */}
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <p className="text-white/85 text-base font-semibold drop-shadow">雪凜</p>
            <p className="text-white/40 text-xs mt-0.5">拖動旋轉 · 雙指/滾輪縮放 · 點擊互動</p>
          </div>
          <button
            onClick={onClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 底部提示 */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <span className="text-white/20 text-xs">按 ESC 或點擊背景關閉</span>
        </div>
      </div>
    </div>
  )
}

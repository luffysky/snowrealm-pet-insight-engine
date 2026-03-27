'use client'

import { useCallback, useState } from 'react'

/**
 * 通用分享小卡 hook — 把任意 DOM 元素轉成 PNG 並下載
 * 搭配 .share-card-root 類名使用
 */
export function useShareCard() {
  const [saving, setSaving] = useState(false)

  const saveImage = useCallback(async (el: HTMLElement | null, filename = 'share-card.png') => {
    if (!el) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        allowTaint: true,
      })
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[useShareCard] 儲存圖片失敗:', err)
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, saveImage }
}

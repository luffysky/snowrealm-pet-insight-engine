'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa_banner_dismissed'

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Already installed (running as standalone PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // User previously dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setShow(false)
    setDeferredPrompt(null)
    setInstalling(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-[calc(var(--bnav-h,76px)+0.75rem)] left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-white/12 rounded-2xl px-4 py-3.5 shadow-2xl shadow-black/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">安裝 SnowRealm</p>
          <p className="text-xs text-white/40 truncate">加到主畫面，離線也能用</p>
        </div>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs rounded-xl transition-colors disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5" />
          安裝
        </button>
        <button onClick={handleDismiss} className="shrink-0 text-white/30 hover:text-white/60 transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

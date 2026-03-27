'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 初始化：從 localStorage 讀取，或跟隨系統
    const stored = localStorage.getItem('ui-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored ? stored === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('ui-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? '切換淺色模式' : '切換深色模式'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800/80 border border-slate-700 text-amber-300 hover:bg-slate-700'
          : 'bg-sky-50/80 border border-sky-200/60 text-sky-600 hover:bg-sky-100'
      } ${className}`}
    >
      {isDark ? (
        /* 月亮 */
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        /* 太陽 */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  )
}

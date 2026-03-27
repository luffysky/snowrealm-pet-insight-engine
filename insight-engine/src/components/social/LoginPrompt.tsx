'use client'

import { X } from 'lucide-react'
import Link from 'next/link'

interface LoginPromptProps {
  open: boolean
  onClose: () => void
  action?: string
}

export function LoginPrompt({ open, onClose, action = '互動' }: LoginPromptProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900/95 border border-white/12 rounded-3xl p-6 space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-white">登入後才能{action}</p>
            <p className="text-sm text-white/40 mt-0.5">加入社群，和大家一起互動吧！</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex-1 text-center py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
          >
            登入
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center py-2.5 bg-white/8 border border-white/12 hover:bg-white/12 text-white/70 rounded-xl text-sm transition-colors"
          >
            免費註冊
          </Link>
        </div>
      </div>
    </div>
  )
}

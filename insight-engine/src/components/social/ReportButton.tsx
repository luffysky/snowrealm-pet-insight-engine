'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'

const REASONS = [
  { value: 'spam',          label: '🗑️ 垃圾訊息' },
  { value: 'fraud',         label: '🚨 詐騙' },
  { value: 'harassment',    label: '😡 騷擾/霸凌' },
  { value: 'inappropriate', label: '🔞 不當內容' },
  { value: 'violence',      label: '⚔️ 暴力' },
  { value: 'privacy',       label: '🔏 侵犯隱私' },
  { value: 'copyright',     label: '©️ 侵犯著作權' },
  { value: 'other',         label: '❓ 其他' },
]

interface ReportButtonProps {
  targetType: 'post' | 'comment' | 'user' | 'message'
  targetId: string
  targetContent?: string
  targetAuthorId?: string
  targetAuthorName?: string
  /** compact = 只顯示 icon（用於 PostCard 選單） */
  compact?: boolean
}

export function ReportButton({ targetType, targetId, targetContent, targetAuthorId, targetAuthorName, compact = false }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/social/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, targetContent, targetAuthorId, targetAuthorName, reason, description }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => { setOpen(false); setDone(false); setReason(''); setDescription('') }, 2000)
      } else {
        const err = await res.json() as { error?: string }
        alert(err.error ?? '提交失敗')
      }
    } catch {
      alert('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact
          ? 'w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400/80 hover:bg-orange-400/10 transition-colors'
          : 'flex items-center gap-1.5 text-xs text-white/30 hover:text-orange-400 transition-colors'
        }
      >
        <Flag className="w-3.5 h-3.5" />
        {!compact && '檢舉'}
        {compact && '檢舉'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white/90 flex items-center gap-2">
                <Flag className="w-4 h-4 text-orange-400" />
                舉報此{targetType === 'post' ? '貼文' : targetType === 'comment' ? '留言' : targetType === 'user' ? '用戶' : '訊息'}
              </h3>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-emerald-400">感謝您的回報！我們會盡快審查。</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/40 mb-3">請選擇舉報原因：</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {REASONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`px-3 py-2 rounded-xl text-xs text-left transition-all border ${
                        reason === r.value
                          ? 'bg-orange-500/20 border-orange-400/40 text-orange-300'
                          : 'bg-white/5 border-white/8 text-white/60 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="補充說明（選填）"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-orange-400/30 resize-none mb-4"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className="w-full py-2.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  {submitting ? '提交中...' : '提交舉報'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

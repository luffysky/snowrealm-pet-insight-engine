'use client'

import { useState, useEffect } from 'react'
import { UserX, UserCheck, Loader2 } from 'lucide-react'

interface BlockButtonProps {
  targetUserId: string
  targetName: string
  onBlocked?: () => void
}

export function BlockButton({ targetUserId, targetName, onBlocked }: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/social/block?targetId=${targetUserId}`)
      .then(r => r.ok ? r.json() as Promise<{ isBlocked: boolean }> : null)
      .then(d => { if (d) setIsBlocked(d.isBlocked) })
      .catch(() => {})
  }, [targetUserId])

  const toggle = async () => {
    if (isBlocked) {
      if (!confirm(`確定解除封鎖 ${targetName}？`)) return
    } else {
      if (!confirm(`確定封鎖 ${targetName}？\n封鎖後對方的貼文和留言將不再顯示給你。`)) return
    }
    setLoading(true)
    try {
      const method = isBlocked ? 'DELETE' : 'POST'
      const url = isBlocked
        ? `/api/admin/social/block?targetId=${targetUserId}`
        : '/api/admin/social/block'
      const res = await fetch(url, {
        method,
        ...(isBlocked ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetId: targetUserId }),
        }),
      })
      if (res.ok) {
        setIsBlocked(!isBlocked)
        if (!isBlocked) onBlocked?.()
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors ${
        isBlocked
          ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
          : 'bg-red-500/10 border-red-400/20 text-red-400/70 hover:bg-red-500/15 hover:text-red-400'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isBlocked ? (
        <UserCheck className="w-3.5 h-3.5" />
      ) : (
        <UserX className="w-3.5 h-3.5" />
      )}
      {isBlocked ? '解除封鎖' : '封鎖'}
    </button>
  )
}

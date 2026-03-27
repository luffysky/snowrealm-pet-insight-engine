'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  initialFollowing?: boolean
  initialCount?: number
  compact?: boolean
}

export function FollowButton({ targetUserId, initialFollowing = false, initialCount, compact = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch('/api/admin/social/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
      if (res.ok) {
        setFollowing(f => !f)
        setCount(c => c !== undefined ? (following ? c - 1 : c + 1) : undefined)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors disabled:opacity-50 ${
          following
            ? 'bg-white/10 border-white/15 text-white/60 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400'
            : 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : following ? (
          <UserCheck className="w-3 h-3" />
        ) : (
          <UserPlus className="w-3 h-3" />
        )}
        {count !== undefined && <span>{count}</span>}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
        following
          ? 'bg-white/10 border-white/15 text-white/60 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400'
          : 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {following ? '已追蹤' : '追蹤'}
      {count !== undefined && <span className="text-xs opacity-70 ml-0.5">{count}</span>}
    </button>
  )
}

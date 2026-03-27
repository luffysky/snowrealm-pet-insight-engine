'use client'

import { useState, useEffect } from 'react'

export interface AuthUser {
  userId: string
  userName: string
  role: string
  tenantId: string
  tenantName: string
}

const CACHE_KEY = 'auth_user_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function readCache(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { user, ts } = JSON.parse(raw) as { user: AuthUser; ts: number }
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null }
    return user
  } catch { return null }
}

function writeCache(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (!user) { sessionStorage.removeItem(CACHE_KEY); return }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ user, ts: Date.now() })) } catch { /* ignore */ }
}

export function clearAuthCache() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(CACHE_KEY)
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => readCache())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() as Promise<{ userId?: string; userName?: string; role?: string; tenantId?: string; tenantName?: string }> : null)
      .then(d => {
        if (d?.userId) {
          const u: AuthUser = {
            userId: d.userId,
            userName: d.userName ?? '',
            role: d.role ?? 'viewer',
            tenantId: d.tenantId ?? '',
            tenantName: d.tenantName ?? '',
          }
          setUser(u)
          writeCache(u)
        } else {
          setUser(null)
          writeCache(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TenantUser {
  id: string
  username: string
  displayName: string | null
  role: string
  tenantId: string
  tenantName: string
  createdAt: string
  authProvider: string
  hasLine: boolean
}

interface TenantInfo {
  slug: string
  name: string
  plan: string
  createdAt: string
  userCount: number
  surveyCount: number
  responseCount: number
  aiUsageCount: number
  notificationCount: number
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
  } catch {
    return iso
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-TW')
  } catch {
    return iso
  }
}

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  email: '📧 Email',
  google: '🔷 Google',
  line: '💬 LINE',
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/super-admin/tenants')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTenants(data.tenants ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleExpandTenant = async (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null)
      return
    }
    setExpandedSlug(slug)
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/super-admin/tenants?view=tenant-detail&slug=${slug}`)
      const data = await res.json()
      setTenantUsers(data.users ?? [])
    } catch {
      setTenantUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const filteredTenants = searchQuery
    ? tenants.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tenants

  if (loading) return <p className="text-white/50 animate-pulse">載入租戶資料...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🏢 租戶管理</h1>
        <span className="text-xs text-white/30">共 {tenants.length} 個租戶</span>
      </div>

      {/* 搜尋 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜尋租戶名稱或 slug..."
        className="w-full max-w-md px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none placeholder:text-slate-600"
      />

      {/* 租戶列表 */}
      <div className="space-y-3">
        {filteredTenants.map((tenant) => (
          <div key={tenant.slug} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            {/* 租戶概覽行 */}
            <button
              onClick={() => handleExpandTenant(tenant.slug)}
              className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{tenant.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tenant.plan === 'free' ? 'bg-slate-700 text-slate-300'
                        : tenant.plan === 'pro' ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tenant.plan}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{tenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-white/50">
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-blue-400">{tenant.userCount}</p>
                  <p>使用者</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-purple-400">{tenant.surveyCount}</p>
                  <p>問卷</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-emerald-400">{tenant.responseCount}</p>
                  <p>回覆</p>
                </div>
                <div className="text-center hidden lg:block">
                  <p className="text-lg font-bold text-amber-400">{tenant.aiUsageCount}</p>
                  <p>AI 用量</p>
                </div>
                <svg className={`w-4 h-4 text-white/30 transition-transform ${expandedSlug === tenant.slug ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 展開詳情 */}
            {expandedSlug === tenant.slug && (
              <div className="border-t border-slate-800 px-5 py-4 space-y-4">
                {/* 用量卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: '使用者', value: tenant.userCount, color: 'text-blue-400' },
                    { label: '問卷', value: tenant.surveyCount, color: 'text-purple-400' },
                    { label: '回覆', value: tenant.responseCount, color: 'text-emerald-400' },
                    { label: 'AI 呼叫', value: tenant.aiUsageCount, color: 'text-amber-400' },
                    { label: '通知', value: tenant.notificationCount, color: 'text-pink-400' },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-xs text-white/40">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* 快速操作 */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/insight-admin/${tenant.slug}`}
                    className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/30 transition-colors"
                  >
                    進入後台 →
                  </Link>
                  <span className="text-xs text-white/30">建立於 {formatDate(tenant.createdAt)}</span>
                </div>

                {/* 使用者列表 */}
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">成員列表</h3>
                  {loadingUsers ? (
                    <p className="text-xs text-white/30 animate-pulse">載入使用者...</p>
                  ) : tenantUsers.length === 0 ? (
                    <p className="text-xs text-white/30">無使用者</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-white/30">
                            <th className="text-left py-2 px-2">名稱</th>
                            <th className="text-left py-2 px-2">帳號</th>
                            <th className="text-left py-2 px-2">角色</th>
                            <th className="text-left py-2 px-2">登入方式</th>
                            <th className="text-left py-2 px-2">LINE</th>
                            <th className="text-left py-2 px-2">註冊時間</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenantUsers.map(u => (
                            <tr key={u.id} className="border-b border-slate-800/30 last:border-0">
                              <td className="py-2 px-2 text-white/80">{u.displayName || '—'}</td>
                              <td className="py-2 px-2 text-white/50 font-mono">{u.username}</td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  u.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400'
                                    : u.role === 'admin' ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-slate-600 text-slate-400'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-white/60">
                                {AUTH_PROVIDER_LABELS[u.authProvider] ?? u.authProvider}
                              </td>
                              <td className="py-2 px-2">
                                {u.hasLine
                                  ? <span className="text-green-400">✓</span>
                                  : <span className="text-white/20">—</span>}
                              </td>
                              <td className="py-2 px-2 text-white/40">{formatDate(u.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

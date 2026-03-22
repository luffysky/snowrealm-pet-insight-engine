'use client'

import { useEffect, useState } from 'react'

interface PlatformUser {
  id: string
  username: string
  displayName: string | null
  email: string | null
  phone: string | null
  role: string
  tenantId: string
  tenantName: string
  createdAt: string
  authProvider: string
  hasLine: boolean
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) } catch { return iso }
}

const AUTH_LABELS: Record<string, string> = {
  email: '📧 Email',
  phone: '📱 手機',
  google: '🔷 Google',
  line: '💬 LINE',
}

/** 將 E.164 格式的手機號碼轉回居民易讀格式（以台灣為例） */
function formatUsername(username: string): string {
  // E.164 格式: +886xxxxxxxxx → 09xxxxxxxx
  if (/^\+886[0-9]{9}$/.test(username)) {
    return '0' + username.slice(4)
  }
  return username
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProvider, setFilterProvider] = useState<string>('all')

  useEffect(() => {
    fetch('/api/super-admin/tenants?view=users')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setUsers(data.users ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider = filterProvider === 'all' || u.authProvider === filterProvider
    return matchesSearch && matchesProvider
  })

  // 統計
  const totalUsers = users.length
  const emailUsers = users.filter(u => u.authProvider === 'email').length
  const googleUsers = users.filter(u => u.authProvider === 'google').length
  const lineUsers = users.filter(u => u.hasLine).length

  if (loading) return <p className="text-white/50 animate-pulse">載入使用者資料...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">👤 全平台使用者</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '總使用者', value: totalUsers, color: 'text-cyan-400' },
          { label: 'Email 註冊', value: emailUsers, color: 'text-blue-400' },
          { label: 'Google 登入', value: googleUsers, color: 'text-emerald-400' },
          { label: 'LINE 綁定', value: lineUsers, color: 'text-green-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* 搜尋 + 篩選 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋帳號、名稱、組織..."
          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none placeholder:text-slate-600"
        />
        <select
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none cursor-pointer"
        >
          <option value="all">全部登入方式</option>
          <option value="email">📧 Email</option>
          <option value="google">🔷 Google</option>
          <option value="line">💬 LINE</option>
        </select>
      </div>

      {/* 使用者表格 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">名稱</th>
                <th className="text-left px-4 py-2">帳號</th>
                <th className="text-left px-4 py-2">聯絡資訊</th>
                <th className="text-left px-4 py-2">組織</th>
                <th className="text-left px-4 py-2">角色</th>
                <th className="text-left px-4 py-2">登入方式</th>
                <th className="text-left px-4 py-2">LINE</th>
                <th className="text-left px-4 py-2">註冊時間</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 text-white/80 font-medium">{u.displayName || '—'}</td>
                  <td className="px-4 py-2.5 text-white/50 font-mono text-xs">{formatUsername(u.username)}</td>
                  <td className="px-4 py-2.5 text-white/50 text-xs">
                    {u.email && <span>{u.email}</span>}
                    {u.phone && <span className="font-mono">{formatUsername(u.phone)}</span>}
                    {!u.email && !u.phone && <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-white/60 text-xs">{u.tenantName}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400'
                        : u.role === 'admin' ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-600 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/60 text-xs">
                    {AUTH_LABELS[u.authProvider] ?? u.authProvider}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {u.hasLine
                      ? <span className="text-green-400 text-xs">✓ 已綁定</span>
                      : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-white/40 text-xs">{formatTime(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <p className="text-center text-white/30 text-sm py-8">無符合條件的使用者</p>
        )}
      </div>

      <p className="text-xs text-white/20 text-right">顯示 {filteredUsers.length} / {totalUsers} 筆</p>
    </div>
  )
}

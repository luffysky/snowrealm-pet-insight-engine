'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  balance: number | null
}

interface GrantLog {
  id: string
  targetType: 'all' | 'specific'
  amount: number
  reason: string
  affectedCount: number
  createdAt: string
}

export default function SuperAdminZcoinPage() {
  // ── 批量發放 ──
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all')
  const [granting, setGranting] = useState(false)
  const [grantMsg, setGrantMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── 用戶搜尋（指定發放用） ──
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<UserRow[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<UserRow[]>([])

  // ── 發放記錄 ──
  const [logs, setLogs] = useState<GrantLog[]>([])

  // ── 搜尋用戶（從 tenants API 取全部，前端過濾） ──
  const [allUsers, setAllUsers] = useState<UserRow[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  const loadAllUsers = useCallback(async () => {
    if (usersLoaded) return
    setSearching(true)
    try {
      const res = await fetch('/api/super-admin/tenants?view=users')
      const data = await res.json() as { users?: { id: string; username: string | null; displayName: string | null; avatarUrl?: string | null }[] }
      const mapped = (data.users ?? []).map(u => ({
        id: u.id,
        username: u.username,
        display_name: u.displayName,
        avatar_url: u.avatarUrl ?? null,
        balance: null,
      }))
      setAllUsers(mapped)
      setUsersLoaded(true)
    } catch { /* ignore */ } finally {
      setSearching(false)
    }
  }, [usersLoaded])

  const searchUsers = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    const lower = q.toLowerCase()
    const filtered = allUsers.filter(u =>
      u.display_name?.toLowerCase().includes(lower) ||
      u.username?.toLowerCase().includes(lower) ||
      u.id.toLowerCase().includes(lower)
    ).slice(0, 10)
    setSearchResults(filtered)
  }, [allUsers])

  useEffect(() => {
    if (targetMode === 'specific' && !usersLoaded) loadAllUsers()
  }, [targetMode, usersLoaded, loadAllUsers])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchQ), 200)
    return () => clearTimeout(t)
  }, [searchQ, searchUsers])

  const toggleUser = (user: UserRow) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    )
  }

  // ── 執行發放 ──
  const executeGrant = async () => {
    const amt = parseInt(amount, 10)
    if (!amt || isNaN(amt) || amt <= 0) return
    if (targetMode === 'specific' && selectedUsers.length === 0) {
      setGrantMsg({ type: 'err', text: '請先選擇要發放的用戶' })
      return
    }
    setConfirmOpen(false)
    setGranting(true)
    setGrantMsg(null)
    try {
      const body = targetMode === 'all'
        ? { amount: amt, reason: reason || 'super_admin_bulk_grant', targetAll: true }
        : { amount: amt, reason: reason || 'super_admin_grant', targetUserIds: selectedUsers.map(u => u.id) }

      const res = await fetch('/api/super-admin/zcoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { ok?: boolean; affectedCount?: number; error?: string }
      if (data.ok) {
        const newLog: GrantLog = {
          id: Date.now().toString(),
          targetType: targetMode,
          amount: amt,
          reason: reason || (targetMode === 'all' ? 'super_admin_bulk_grant' : 'super_admin_grant'),
          affectedCount: data.affectedCount ?? selectedUsers.length,
          createdAt: new Date().toISOString(),
        }
        setLogs(prev => [newLog, ...prev])
        setGrantMsg({ type: 'ok', text: `✅ 已成功發放 ${amt} Z幣 給 ${data.affectedCount} 位用戶` })
        setAmount('')
        setReason('')
        setSelectedUsers([])
        setSearchQ('')
        setSearchResults([])
      } else {
        setGrantMsg({ type: 'err', text: `❌ ${data.error ?? '操作失敗'}` })
      }
    } catch {
      setGrantMsg({ type: 'err', text: '❌ 網路錯誤，請重試' })
    } finally {
      setGranting(false)
    }
  }

  const amt = parseInt(amount, 10)
  const canGrant = !isNaN(amt) && amt > 0 && !granting &&
    (targetMode === 'all' || selectedUsers.length > 0)

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-bold text-white">💰 Z幣管理</h1>
        <p className="text-white/40 text-sm mt-1">發放或調整平台 Z幣餘額</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 發放面板 ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">發放 Z幣</h2>
          </div>
          <div className="p-5 space-y-4">

            {/* 金額 */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">發放金額（Z幣）</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="例：500"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* 備註 */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">備註（記錄用）</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="例：平台活動獎勵"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* 目標模式 */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">發放目標</label>
              <div className="grid grid-cols-2 gap-2">
                {(['all', 'specific'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setTargetMode(mode); setSelectedUsers([]); setSearchQ(''); setSearchResults([]) }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      targetMode === mode
                        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                        : 'bg-slate-800 border-slate-700 text-white/40 hover:text-white/70 hover:border-slate-600'
                    }`}
                  >
                    {mode === 'all' ? '🌍 全部用戶' : '🎯 指定用戶'}
                  </button>
                ))}
              </div>
            </div>

            {/* 指定用戶搜尋 */}
            {targetMode === 'specific' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="搜尋用戶名稱..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />

                {/* 搜尋結果 */}
                {searching && <p className="text-xs text-white/30 text-center py-2">搜尋中...</p>}
                {!searching && searchResults.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map(u => {
                      const selected = !!selectedUsers.find(s => s.id === u.id)
                      const name = u.display_name || u.username || u.id.slice(0, 8)
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleUser(u)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${selected ? 'bg-yellow-500/10' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500/40 to-amber-600/40 flex items-center justify-center text-xs font-bold text-white/70 shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 truncate">{name}</p>
                            {u.username && <p className="text-[10px] text-white/30">@{u.username}</p>}
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] shrink-0 transition-colors ${selected ? 'bg-yellow-500 border-yellow-400 text-white' : 'border-slate-600'}`}>
                            {selected && '✓'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 已選用戶 */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map(u => (
                      <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs rounded-full">
                        {u.display_name || u.username || u.id.slice(0, 8)}
                        <button onClick={() => toggleUser(u)} className="text-yellow-400/60 hover:text-yellow-300 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 發放按鈕 */}
            <button
              onClick={() => { if (canGrant) setConfirmOpen(true) }}
              disabled={!canGrant}
              className="w-full py-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {granting ? '發放中...' : `💰 發放${amount ? ` ${amount} Z幣` : ''}${targetMode === 'all' ? '給全部用戶' : selectedUsers.length > 0 ? ` 給 ${selectedUsers.length} 位用戶` : ''}`}
            </button>

            {grantMsg && (
              <p className={`text-xs text-center py-1 ${grantMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {grantMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* ── 本次操作記錄 ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">本次操作記錄</h2>
          </div>
          {logs.length === 0 ? (
            <div className="py-16 text-center text-white/20 text-sm">
              <p className="text-2xl mb-2">💰</p>
              <p>尚未執行任何發放操作</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {logs.map(log => (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-white font-semibold">+{log.amount} Z幣</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {log.targetType === 'all' ? '🌍 全部用戶' : `🎯 指定 ${log.affectedCount} 位`}
                        {' · '}{log.reason}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-emerald-400 font-semibold">{log.affectedCount} 人</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{new Date(log.createdAt).toLocaleTimeString('zh-TW')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 確認 Modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">確認發放</h3>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-5 space-y-1">
              <p className="text-sm text-white">
                <span className="text-yellow-400 font-bold">+{amount} Z幣</span>
                {targetMode === 'all' ? ' 給全部用戶' : ` 給 ${selectedUsers.length} 位用戶`}
              </p>
              {reason && <p className="text-xs text-white/50">備註：{reason}</p>}
              {targetMode === 'all' && (
                <p className="text-xs text-amber-400/80">⚠️ 此操作將影響所有平台用戶，請確認金額正確</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-white/50 hover:text-white text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeGrant}
                className="flex-1 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 text-sm font-semibold transition-colors"
              >
                確認發放
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

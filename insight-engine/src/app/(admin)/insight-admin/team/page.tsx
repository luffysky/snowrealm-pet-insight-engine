'use client'

import { useState, useEffect, useCallback } from 'react'

interface Member {
  id: string
  display_name: string
  email: string
  role: string
  created_at: string
}

interface Invite {
  id: string
  email: string
  role: string
  token: string
  used: boolean
  expires_at: string
  created_at: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/team')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMembers(data.members ?? [])
      setInvites(data.invites ?? [])
    } catch {
      setError('無法載入團隊資料')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  const handleInvite = async (isLine: boolean = false) => {
    if (!isLine && !inviteEmail.trim()) return
    setInviting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLine ? { isLineInvite: true, role: inviteRole } : { email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '邀請失敗'); return }
      setInviteResult({ url: data.inviteUrl })
      if (isLine) {
        setInviteEmail('') // 清空可能填寫的信箱
      }
      fetchTeam()
    } catch {
      setError('邀請失敗')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('確定要撤銷此邀請？')) return
    await fetch(`/api/admin/team?id=${inviteId}`, { method: 'DELETE' })
    fetchTeam()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLineShare = (url: string) => {
    const text = `邀請您加入毛行天下後台管理團隊！請點擊以下連結註冊：\n${url}`
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) return <p className="text-slate-400 animate-pulse">載入中…</p>

  const activeInvites = invites.filter(i => !i.used && new Date(i.expires_at) > new Date())


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">團隊管理</h1>
        <button
          onClick={() => { setShowInvite(!showInvite); setInviteResult(null); setInviteEmail(''); setError('') }}
          className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover text-white rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + 邀請管理員
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* 邀請表單 */}
      {showInvite && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">邀請新成員</h2>
          <p className="text-sm text-slate-400">
            輸入對方的 Email，系統會產生邀請連結。對方透過連結註冊後即自動加入你的團隊。
          </p>

          {inviteResult ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-400">邀請連結已產生（7 天內有效）：</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteResult.url}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(inviteResult.url)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition cursor-pointer"
                >
                  {copied ? '已複製 ✓' : '複製'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                請將此連結傳給對方，對方用此連結註冊後會自動成為你的團隊成員。
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">角色</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="admin">管理員</option>
                  <option value="editor">編輯者</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleInvite(false)}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                >
                  {inviting ? '產生中...' : '產生 Email 專屬邀請連結'}
                </button>
                <div className="text-center text-xs text-slate-500">或</div>
                <button
                  onClick={() => handleInvite(true)}
                  disabled={inviting}
                  className="px-4 py-2 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap"
                >
                  {inviting ? '產生中...' : '產生通用邀請連結 (無需 Email)'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 成員列表 */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          成員 <span className="text-slate-400 font-normal text-sm">({members.length})</span>
        </h2>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-125">
            <thead className="bg-slate-800/60">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">名稱</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">角色</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">加入時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white">{m.display_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{m.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      m.role === 'super_admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-t-accent-bg text-t-accent'
                    }`}>
                      {m.role === 'super_admin' ? '超級管理員' : m.role === 'editor' ? '編輯者' : '管理員'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(m.created_at).toLocaleDateString('zh-TW')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* 待接受邀請 */}
      {activeInvites.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            待接受邀請 <span className="text-slate-400 font-normal text-sm">({activeInvites.length})</span>
          </h2>
          <div className="space-y-2">
            {activeInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white text-sm">{inv.email}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-400 text-xs">
                    {inv.role === 'editor' ? '編輯者' : '管理員'}
                  </span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-500 text-xs">
                    到期：{new Date(inv.expires_at).toLocaleDateString('zh-TW')}
                  </span>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                >
                  撤銷
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

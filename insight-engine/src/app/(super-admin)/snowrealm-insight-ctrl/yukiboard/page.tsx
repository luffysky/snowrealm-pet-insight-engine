'use client'

import { useEffect, useState } from 'react'

// ─── 特權管理 ───
interface YukiBoardUser {
  id: string
  username: string
  display_name: string
  yukiboard_privilege: boolean
  yukiboard_privilege_note: string | null
}

// ─── 邀請碼 ───
interface InviteCode {
  id: string
  code: string
  type: string
  daily_token_limit: number
  max_uses: number
  used_count: number
  is_active: boolean
  created_at: string
  expires_at: string | null
  note: string | null
}

const TYPE_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  standard:  { label: '標準', color: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  kol:       { label: 'KOL',  color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  permanent: { label: '永久', color: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
}

export default function YukiBoardPage() {
  const [tab, setTab] = useState<'privilege' | 'invite'>('invite')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">YukiBoard 管理</h1>
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
          <TabBtn active={tab === 'invite'} onClick={() => setTab('invite')}>邀請碼</TabBtn>
          <TabBtn active={tab === 'privilege'} onClick={() => setTab('privilege')}>特權</TabBtn>
        </div>
      </div>
      {tab === 'invite' ? <InviteSection /> : <PrivilegeSection />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// 邀請碼管理
// ═══════════════════════════════════════════════════════════

function InviteSection() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 產生表單
  const [genType, setGenType] = useState('standard')
  const [genCount, setGenCount] = useState(10)
  const [genNote, setGenNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string[] | null>(null)

  // 篩選
  const [filterType, setFilterType] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function loadCodes() {
    try {
      const res = await fetch('/api/super-admin/yukiboard-invite')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCodes(data.codes)
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCodes() }, [])

  async function generateCodes() {
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/super-admin/yukiboard-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: genType, count: genCount, note: genNote }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGenResult(data.codes)
      loadCodes()
    } catch (e) {
      alert(e instanceof Error ? e.message : '產生失敗')
    } finally {
      setGenerating(false)
    }
  }

  async function toggleActive(code: InviteCode) {
    try {
      await fetch('/api/super-admin/yukiboard-invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, is_active: !code.is_active }),
      })
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_active: !c.is_active } : c))
    } catch { /* ignore */ }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function copyAllGenerated() {
    if (genResult) {
      navigator.clipboard.writeText(genResult.join('\n'))
      alert(`已複製 ${genResult.length} 個邀請碼`)
    }
  }

  const filtered = codes.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false
    if (!showInactive && !c.is_active) return false
    return true
  })

  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active).length,
    used: codes.filter(c => c.used_count > 0).length,
    standard: codes.filter(c => c.type === 'standard' && c.is_active).length,
    kol: codes.filter(c => c.type === 'kol' && c.is_active).length,
    permanent: codes.filter(c => c.type === 'permanent' && c.is_active).length,
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入中...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="總數" value={stats.total} sub={`${stats.active} 有效`} />
        <StatCard label="已使用" value={stats.used} sub={`${stats.total - stats.used} 未使用`} />
        <StatCard label="類型分布" value="" sub={`S:${stats.standard} K:${stats.kol} P:${stats.permanent}`} />
      </div>

      {/* 產生器 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">產生邀請碼</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-white/50 mb-1">類型</label>
            <select
              value={genType}
              onChange={e => setGenType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="standard">標準 (5K tokens/日)</option>
              <option value="kol">KOL (20K tokens/日, 50次)</option>
              <option value="permanent">永久 (無限)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">數量</label>
            <input
              type="number"
              value={genCount}
              onChange={e => setGenCount(Math.max(1, Math.min(500, Number(e.target.value))))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-white/50 mb-1">備註（選填）</label>
            <input
              type="text"
              value={genNote}
              onChange={e => setGenNote(e.target.value)}
              placeholder="例：Discord 活動發放"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={generateCodes}
            disabled={generating}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
          >
            {generating ? '產生中...' : `產生 ${genCount} 個`}
          </button>
        </div>

        {/* 產生結果 */}
        {genResult && (
          <div className="mt-4 bg-slate-800/60 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-emerald-400">✓ 已產生 {genResult.length} 個邀請碼</span>
              <button
                onClick={copyAllGenerated}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                全部複製
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs text-white/70">
              {genResult.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{code}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(code) }}
                    className="text-white/30 hover:text-white/60"
                  >
                    📋
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 篩選 + 列表 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800">
          <span className="text-sm text-white/50">篩選：</span>
          {['all', 'standard', 'kol', 'permanent'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterType === t
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'text-white/40 border-slate-700 hover:text-white/60'
              }`}
            >
              {t === 'all' ? '全部' : TYPE_LABELS[t]?.label ?? t}
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-white/40 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded border-slate-600"
            />
            顯示已停用
          </label>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-white/50">
              <th className="px-4 py-2.5">邀請碼</th>
              <th className="px-4 py-2.5">類型</th>
              <th className="px-4 py-2.5">Token/日</th>
              <th className="px-4 py-2.5">使用</th>
              <th className="px-4 py-2.5">備註</th>
              <th className="px-4 py-2.5">建立時間</th>
              <th className="px-4 py-2.5 text-center">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30">沒有邀請碼</td></tr>
            )}
            {filtered.map(code => {
              const typeInfo = TYPE_LABELS[code.type] ?? { label: code.type, color: 'text-white', badge: 'bg-slate-700 text-white' }
              return (
                <tr key={code.id} className={`hover:bg-slate-800/30 transition-colors ${!code.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => copyCode(code.code, code.id)}
                      className="font-mono text-xs text-white hover:text-cyan-300 transition-colors"
                      title="點擊複製"
                    >
                      {copiedId === code.id ? '✓ 已複製' : code.code}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${typeInfo.badge}`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/60 text-xs">
                    {code.daily_token_limit.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-white/60 text-xs">
                    {code.used_count} / {code.max_uses}
                  </td>
                  <td className="px-4 py-2.5 text-white/40 text-xs max-w-[150px] truncate">
                    {code.note || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-white/40 text-xs">
                    {new Date(code.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleActive(code)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        code.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        code.is_active ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-4">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      {value !== '' && <div className="text-2xl font-bold text-white">{value}</div>}
      <div className="text-sm text-white/50">{sub}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 特權管理（原有功能）
// ═══════════════════════════════════════════════════════════

function PrivilegeSection() {
  const [users, setUsers] = useState<YukiBoardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<{ userId: string; note: string } | null>(null)

  async function loadUsers() {
    try {
      const res = await fetch('/api/super-admin/yukiboard-privilege')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsers(data.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function togglePrivilege(user: YukiBoardUser) {
    setSaving(user.id)
    try {
      const res = await fetch('/api/super-admin/yukiboard-privilege', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hasPrivilege: !user.yukiboard_privilege,
          note: user.yukiboard_privilege_note,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, yukiboard_privilege: !u.yukiboard_privilege } : u),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : '更新失敗')
    } finally {
      setSaving(null)
    }
  }

  async function saveNote(userId: string, note: string) {
    setSaving(userId)
    try {
      const user = users.find(u => u.id === userId)
      const res = await fetch('/api/super-admin/yukiboard-privilege', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hasPrivilege: user?.yukiboard_privilege ?? false,
          note: note || null,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, yukiboard_privilege_note: note || null } : u),
      )
      setEditingNote(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : '儲存失敗')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入中...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  const privilegedCount = users.filter(u => u.yukiboard_privilege).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">已授權 {privilegedCount} / {users.length} 人</span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-white/50">
              <th className="px-4 py-3">使用者</th>
              <th className="px-4 py-3">帳號</th>
              <th className="px-4 py-3">備註</th>
              <th className="px-4 py-3 text-center">YukiBoard 特權</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-white">{user.display_name}</td>
                <td className="px-4 py-3 text-white/60">{user.username}</td>
                <td className="px-4 py-3">
                  {editingNote?.userId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingNote.note}
                        onChange={e => setEditingNote({ userId: user.id, note: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') saveNote(user.id, editingNote.note) }}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm w-48 focus:outline-none focus:border-cyan-500"
                        placeholder="輸入備註..."
                        autoFocus
                      />
                      <button
                        onClick={() => saveNote(user.id, editingNote.note)}
                        disabled={saving === user.id}
                        className="text-cyan-400 hover:text-cyan-300 text-xs"
                      >儲存</button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="text-white/40 hover:text-white/60 text-xs"
                      >取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingNote({ userId: user.id, note: user.yukiboard_privilege_note ?? '' })}
                      className="text-white/40 hover:text-white/60 text-xs"
                    >
                      {user.yukiboard_privilege_note || '點擊新增備註'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => togglePrivilege(user)}
                    disabled={saving === user.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      user.yukiboard_privilege ? 'bg-cyan-500' : 'bg-slate-700'
                    } ${saving === user.id ? 'opacity-50' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      user.yukiboard_privilege ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface YukiBoardUser {
  id: string
  username: string
  display_name: string
  yukiboard_privilege: boolean
  yukiboard_privilege_note: string | null
}

export default function YukiBoardPage() {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">YukiBoard 特權管理</h1>
        <span className="text-sm text-white/50">
          已授權 {privilegedCount} / {users.length} 人
        </span>
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
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="text-white/40 hover:text-white/60 text-xs"
                      >
                        取消
                      </button>
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
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        user.yukiboard_privilege ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
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

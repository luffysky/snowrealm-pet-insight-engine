'use client'

import { useState, useEffect, useCallback } from 'react'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  created_at: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', plan: 'free' })
  const [saving, setSaving] = useState(false)

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tenants')
      if (!res.ok) {
        if (res.status === 403) { setError('僅 super_admin 可存取'); return }
        throw new Error()
      }
      const data = await res.json()
      setTenants(data.tenants ?? [])
    } catch {
      setError('無法載入租戶列表')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? '建立失敗')
        return
      }
      setShowAdd(false)
      setForm({ name: '', slug: '', plan: 'free' })
      fetchTenants()
    } catch {
      setError('建立失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (slug: string, active: boolean) => {
    await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, is_active: !active }),
    })
    fetchTenants()
  }

  if (loading) return <div className="text-[#8a7ca8] py-12 text-center">載入中...</div>
  if (error && tenants.length === 0) return <div className="text-red-400 py-12 text-center">{error}</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🏢 租戶管理</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 text-sm bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white rounded-lg cursor-pointer"
        >
          {showAdd ? '取消' : '新增租戶'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {showAdd && (
        <div className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="名稱"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/60 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-[#3d3155] text-sm"
            />
            <input
              placeholder="slug（英數字小寫+連字號）"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="bg-white/60 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-[#3d3155] text-sm"
            />
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="bg-white/60 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-[#3d3155] text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {saving ? '建立中...' : '確認建立'}
          </button>
        </div>
      )}

      <div className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-150">
          <thead>
            <tr className="border-b border-[#b8a9e8]/20 text-[#8a7ca8]">
              <th className="text-left px-4 py-3">名稱</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">方案</th>
              <th className="text-left px-4 py-3">狀態</th>
              <th className="text-left px-4 py-3">建立時間</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-[#b8a9e8]/20 hover:bg-white/50/30">
                <td className="px-4 py-3 text-[#3d3155] font-medium">{t.name}</td>
                <td className="px-4 py-3 text-[#8a7ca8] font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    t.plan === 'pro' ? 'bg-[#b8a9e8]/20 text-t-accent'
                    : t.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-[#b8a9e8]/15/30 text-[#8a7ca8]'}`}>
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${t.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.is_active ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#3d3155]0 text-xs">
                  {new Date(t.created_at).toLocaleDateString('zh-TW')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggle(t.slug, t.is_active)}
                    className={`text-xs px-2 py-1 rounded cursor-pointer ${
                      t.is_active
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {t.is_active ? '停用' : '啟用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

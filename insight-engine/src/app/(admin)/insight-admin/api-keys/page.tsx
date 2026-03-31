'use client'

import { useEffect, useState, useCallback } from 'react'

interface ApiKey {
  id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

const VALID_SCOPES = [
  { value: 'rules:read', label: '讀取規則' },
  { value: 'validate', label: '驗證問卷' },
  { value: 'submit', label: '提交填答' },
]

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['rules:read'])
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-keys')
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch {
      setError('載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  async function handleCreate() {
    if (selectedScopes.length === 0) {
      setError('請選擇至少一個 scope')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || null, scopes: selectedScopes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '建立失敗')
        return
      }
      setRawKey(data.rawKey)
      setShowForm(false)
      setNewKeyName('')
      setSelectedScopes(['rules:read'])
      await fetchKeys()
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要停用此 API Key？停用後無法復原。')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/api-keys?id=${id}`, { method: 'DELETE' })
      await fetchKeys()
    } finally {
      setDeletingId(null)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function toggleScope(scope: string) {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🔑 API Key 管理</h1>
          <p className="text-sm text-[#8a7ca8] mt-1">用於第三方整合的 API 存取金鑰</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setRawKey(null); setError(null) }}
          className="px-4 py-2 bg-[#b8a9e8] hover:bg-[#a898d8] text-white text-sm rounded-lg transition-colors"
        >
          + 建立 API Key
        </button>
      </div>

      {/* 剛建立的 Key 提示 */}
      {rawKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-400">✅ API Key 已建立！請立即複製，此金鑰只顯示一次。</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-black/20 text-emerald-300 px-3 py-2 rounded-lg break-all">
              {rawKey}
            </code>
            <button
              onClick={() => handleCopy(rawKey)}
              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded-lg transition-colors shrink-0"
            >
              {copied ? '✅' : '複製'}
            </button>
          </div>
        </div>
      )}

      {/* 建立表單 */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#3d3155]">建立新 API Key</h2>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="space-y-1">
            <label className="text-xs text-[#8a7ca8]">名稱（選填）</label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="例：第三方整合、開發測試"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#b8a9e8]/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#8a7ca8]">權限範圍（Scopes）</label>
            <div className="flex flex-wrap gap-2">
              {VALID_SCOPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => toggleScope(s.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedScopes.includes(s.value)
                      ? 'bg-[#b8a9e8]/25 border-[#b8a9e8]/50 text-[#6b5fa8]'
                      : 'bg-white/5 border-white/10 text-[#8a7ca8] hover:text-slate-300'
                  }`}
                >
                  {s.label} <span className="opacity-60 font-mono">{s.value}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-[#b8a9e8] hover:bg-[#a898d8] text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
            >
              {creating ? '建立中…' : '建立'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#8a7ca8] text-sm rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Key 列表 */}
      {loading ? (
        <p className="text-[#8a7ca8] animate-pulse text-sm">載入中…</p>
      ) : keys.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-[#8a7ca8] text-sm">
          尚未建立任何 API Key。建立後可用於第三方系統整合。
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#8a7ca8] text-xs">
                <th className="text-left px-4 py-3">名稱 / 前綴</th>
                <th className="text-left px-4 py-3">Scopes</th>
                <th className="text-left px-4 py-3">建立時間</th>
                <th className="text-left px-4 py-3">最後使用</th>
                <th className="text-left px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium">{k.name ?? '未命名'}</p>
                    <p className="font-mono text-xs text-[#8a7ca8]">{k.key_prefix}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 bg-[#b8a9e8]/15 text-[#8a7ca8] rounded font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8a7ca8]">{formatDate(k.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-[#8a7ca8]">{formatDate(k.last_used_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === k.id ? '停用中…' : '停用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 使用說明 */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-[#8a7ca8]">使用說明</p>
        <p className="text-xs text-[#8a7ca8]/70">
          將 API Key 加入請求 Header：<code className="font-mono bg-black/20 px-1 rounded">Authorization: Bearer sie_xxxxxxxx...</code>
        </p>
        <p className="text-xs text-[#8a7ca8]/70">
          端點：<code className="font-mono bg-black/20 px-1 rounded">GET /api/ai/rules</code>、
          <code className="font-mono bg-black/20 px-1 rounded">POST /api/ai/validate</code>
        </p>
      </div>
    </div>
  )
}

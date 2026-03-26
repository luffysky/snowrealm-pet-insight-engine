'use client'

import { useState, useEffect, useCallback } from 'react'

interface AiConfig {
  id: string
  provider: string
  displayName: string
  defaultModel: string
  isPrimary: boolean
  isActive: boolean
  hasKey: boolean
  maskedKey: string | null
  createdAt: string
}

interface UsageStats {
  usage: { action: string; keySource: string; count: number; totalPromptTokens: number; totalCompletionTokens: number }[]
  freeQuota: {
    generate: { used: number; limit: number }
    regenerate: { used: number; limit: number }
  }
  platformPartner?: boolean
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', icon: '🤖', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic', icon: '🧠', models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'] },
  { value: 'google', label: 'Google AI', icon: '🔷', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
]

type SetupStep = 'list' | 'provider' | 'apikey' | 'model' | 'done'

export default function AiSettingsPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 引導式設定狀態
  const [setupStep, setSetupStep] = useState<SetupStep>('list')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ id: string; valid: boolean; maskedKey?: string; error?: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editModel, setEditModel] = useState('')
  const [editApiKey, setEditApiKey] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/admin/ai-settings'),
        fetch('/api/admin/ai-usage'),
      ])
      if (configRes.ok) {
        const data = await configRes.json()
        setConfigs(data.configs ?? [])
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const resetSetup = () => {
    setSetupStep('list')
    setSelectedProvider('')
    setApiKeyInput('')
    setSelectedModel('')
    setIsPrimary(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput,
          defaultModel: selectedModel,
          displayName: PROVIDERS.find((p) => p.value === selectedProvider)?.label ?? selectedProvider,
          isPrimary,
        }),
      })
      if (res.ok) {
        setSetupStep('done')
        fetchConfigs()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async (id: string) => {
    setVerifying(id)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'verify' }),
      })
      if (res.ok) {
        const data = await res.json()
        setVerifyResult({ id, ...data })
      }
    } finally {
      setVerifying(null)
    }
  }

  const handleToggle = async (id: string) => {
    await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    })
    fetchConfigs()
  }

  const handleSetPrimary = async (id: string) => {
    await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'set-primary' }),
    })
    fetchConfigs()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/ai-settings?id=${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchConfigs()
  }

  const handleEditSave = async (id: string) => {
    setEditSaving(true)
    try {
      const body: Record<string, string> = { id, action: 'update' }
      if (editModel) body.defaultModel = editModel
      if (editApiKey) body.newApiKey = editApiKey
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setEditingConfig(null)
        setEditModel('')
        setEditApiKey('')
        fetchConfigs()
      }
    } finally {
      setEditSaving(false)
    }
  }

  const providerInfo = PROVIDERS.find((p) => p.value === selectedProvider)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">🤖 AI 設定</h1>
        <div className="text-slate-400 animate-pulse">載入中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🤖 AI 設定</h1>
        {setupStep === 'list' && (
          <button
            onClick={() => setSetupStep('provider')}
            className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            + 新增 AI Provider
          </button>
        )}
      </div>

      {/* 平台合作夥伴（僅總後台對你的帳號開啟；同組織其他人仍受額度限制） */}
      {stats?.platformPartner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">🤝 平台合作夥伴權限（僅限本帳號）</p>
          <p className="mt-1 text-amber-100/70">
            使用平台提供的 AI Key 時，系統<strong>不會</strong>因免費次數上限而擋下你的請求；用量仍會入帳供營運參考。
            同租戶其他管理員／編輯者<strong>不會</strong>自動獲得此權限。
          </p>
        </div>
      )}

      {/* 免費額度狀態 */}
      {stats && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">📊 免費額度</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-t-card-bg rounded-lg p-3">
              <p className="text-xs text-slate-500">AI 生成問卷</p>
              <p className="text-lg font-bold text-white">
                {stats.platformPartner ? (
                  <>略過上限檢查（本帳號）</>
                ) : (
                  <>
                    剩餘 {Math.max(0, stats.freeQuota.generate.limit - stats.freeQuota.generate.used)} 次
                    <span className="text-xs text-slate-500 ml-2 font-normal">
                      （已用 {stats.freeQuota.generate.used} / {stats.freeQuota.generate.limit}）
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="bg-t-card-bg rounded-lg p-3">
              <p className="text-xs text-slate-500">AI 重新生成</p>
              <p className="text-lg font-bold text-white">
                {stats.platformPartner ? (
                  <>略過上限檢查（本帳號）</>
                ) : (
                  <>
                    剩餘 {Math.max(0, stats.freeQuota.regenerate.limit - stats.freeQuota.regenerate.used)} 次
                    <span className="text-xs text-slate-500 ml-2 font-normal">
                      （已用 {stats.freeQuota.regenerate.used} / {stats.freeQuota.regenerate.limit}）
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            💡 免費額度使用平台 Key（GPT-4o-mini）。用完後需設定自己的 API Key 才能繼續使用。
            {stats.platformPartner && ' 你的帳號為合作夥伴：平台 Key 不套用上述次數上限。'}
          </p>
        </div>
      )}

      {/* ===== 引導式設定流程 ===== */}
      {setupStep === 'provider' && (
        <div className="bg-slate-800/50 border border-t-accent-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Step 1：選擇 AI Provider</h3>
            <button onClick={resetSetup} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕ 取消</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setSelectedProvider(p.value)
                  setSelectedModel(p.models[0])
                  setSetupStep('apikey')
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedProvider === p.value
                    ? 'border-t-accent-border bg-t-accent-bg'
                    : 'border-slate-700 hover:border-slate-500 bg-t-card-bg'
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <p className="text-white font-medium mt-2">{p.label}</p>
                <p className="text-xs text-slate-400 mt-1">{p.models.length} 個模型可用</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {setupStep === 'apikey' && providerInfo && (
        <div className="bg-slate-800/50 border border-t-accent-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Step 2：輸入 {providerInfo.label} API Key
            </h3>
            <button onClick={resetSetup} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕ 取消</button>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
            🔒 API Key 會以 AES-256-GCM 加密儲存，前端永遠不會看到明文。
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={selectedProvider === 'openai' ? 'sk-proj-...' : 'sk-ant-...'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-t-accent-border focus:outline-none"
              />
            </div>
            <button
              onClick={() => setSetupStep('model')}
              disabled={!apiKeyInput.trim()}
              className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              下一步 →
            </button>
          </div>
        </div>
      )}

      {setupStep === 'model' && providerInfo && (
        <div className="bg-slate-800/50 border border-t-accent-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Step 3：選擇預設模型</h3>
            <button onClick={resetSetup} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕ 取消</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">預設模型</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-t-accent-border focus:outline-none"
              >
                {providerInfo.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              設為主要 Provider（AI 生成時優先使用）
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSetupStep('apikey')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
              >
                ← 上一步
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {saving ? '儲存中...' : '✅ 儲存設定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {setupStep === 'done' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
          <p className="text-2xl">✅</p>
          <p className="text-white font-medium">AI Provider 設定完成！</p>
          <p className="text-sm text-slate-400">你現在可以使用 AI 自動生成問卷了。</p>
          <button
            onClick={resetSetup}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            返回列表
          </button>
        </div>
      )}

      {/* ===== 已設定的 Provider 列表 ===== */}
      {setupStep === 'list' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400">已設定的 AI Provider</h3>
          {configs.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">尚未設定任何 AI Provider</p>
              <p className="text-xs text-slate-600 mt-1">
                點擊上方「+ 新增 AI Provider」開始設定，或使用免費額度體驗。
              </p>
            </div>
          ) : (
            configs.map((c) => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {PROVIDERS.find((p) => p.value === c.provider)?.icon ?? '🔌'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{c.displayName}</span>
                        {c.isPrimary && (
                          <span className="px-1.5 py-0.5 bg-t-accent-bg text-t-accent text-xs rounded">主要</span>
                        )}
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'
                        }`}>
                          {c.isActive ? '啟用' : '停用'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        模型: {c.defaultModel} · Key: {c.hasKey ? '已設定' : '未設定'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleVerify(c.id)}
                      disabled={verifying === c.id}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {verifying === c.id ? '驗證中...' : '🔍 驗證'}
                    </button>
                    <button
                      onClick={() => handleToggle(c.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {c.isActive ? '停用' : '啟用'}
                    </button>
                    {!c.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(c.id)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        設為主要
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingConfig(editingConfig === c.id ? null : c.id)
                        setEditModel(c.defaultModel)
                        setEditApiKey('')
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      ✏️ 編輯
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                {/* 內聯編輯 */}
                {editingConfig === c.id && (
                  <div className="mt-3 p-3 bg-slate-900/60 border border-slate-600/60 rounded-xl space-y-3">
                    <p className="text-xs font-medium text-slate-300">編輯 Provider 設定</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="text-xs text-slate-400 w-20 shrink-0">模型</label>
                      <select
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
                      >
                        {(PROVIDERS.find((p) => p.value === c.provider)?.models ?? [c.defaultModel]).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="text-xs text-slate-400 w-20 shrink-0">新 API Key</label>
                      <input
                        type="password"
                        value={editApiKey}
                        onChange={(e) => setEditApiKey(e.target.value)}
                        placeholder="留空則不更新 Key"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingConfig(null); setEditModel(''); setEditApiKey('') }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleEditSave(c.id)}
                        disabled={editSaving}
                        className="px-3 py-1.5 bg-t-btn hover:bg-t-btn-hover text-white rounded-lg text-xs cursor-pointer disabled:opacity-50"
                      >
                        {editSaving ? '儲存中...' : '儲存變更'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 驗證結果 */}
                {verifyResult?.id === c.id && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    verifyResult.valid
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}>
                    {verifyResult.valid
                      ? `✅ Key 有效 — ${verifyResult.maskedKey}`
                      : `❌ Key 無效 — ${verifyResult.error}`}
                  </div>
                )}

                {/* 刪除確認 */}
                {deleteConfirm === c.id && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-red-300">確定要刪除此 Provider？</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 bg-slate-700 text-white rounded text-xs cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs cursor-pointer"
                      >
                        確定刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== 使用統計 ===== */}
      {stats && stats.usage.length > 0 && setupStep === 'list' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">📈 使用統計</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs">
                  <th className="text-left pb-2">動作</th>
                  <th className="text-left pb-2">Key 來源</th>
                  <th className="text-right pb-2">次數</th>
                  <th className="text-right pb-2">Prompt Tokens</th>
                  <th className="text-right pb-2">Completion Tokens</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {stats.usage.map((u, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="py-2">{u.action === 'generate' ? '生成' : '重新生成'}</td>
                    <td className="py-2">{u.keySource === 'platform_key' ? '平台' : '自有'}</td>
                    <td className="text-right py-2">{u.count}</td>
                    <td className="text-right py-2">{u.totalPromptTokens.toLocaleString()}</td>
                    <td className="text-right py-2">{u.totalCompletionTokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

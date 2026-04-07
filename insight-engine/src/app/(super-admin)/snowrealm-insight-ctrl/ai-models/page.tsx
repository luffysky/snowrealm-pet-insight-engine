'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, Server, Cpu, Zap, Globe, Keyboard } from 'lucide-react'

interface AiModel {
  id: string
  provider: string
  modelId: string
  displayName: string
  category: string
  apiEndpoint: string
  hasKey: boolean
  isActive: boolean
  maxTokens: number
  inputPrice: number
  outputPrice: number
  supportedFeatures: string[]
  notes: string
  platform: string
  createdAt: string
  updatedAt: string
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { value: 'anthropic', label: 'Anthropic', icon: '🧠', color: '#d4a574' },
  { value: 'google', label: 'Google AI', icon: '🔷', color: '#4285f4' },
  { value: 'ollama', label: 'Ollama', icon: '🦙', color: '#fff' },
  { value: 'qwen', label: 'Qwen', icon: '🌟', color: '#6366f1' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🔬', color: '#0ea5e9' },
  { value: 'custom', label: '自訂', icon: '⚙️', color: '#9ca3af' },
]

const CATEGORIES = [
  { value: 'chat', label: '對話' },
  { value: 'embedding', label: '嵌入' },
  { value: 'image', label: '圖像' },
  { value: 'tts', label: '語音合成' },
  { value: 'stt', label: '語音辨識' },
  { value: 'moderation', label: '內容審核' },
  { value: 'fraud', label: '防詐偵測' },
  { value: 'translation', label: '翻譯' },
]

const PLATFORMS = [
  { value: 'insight', label: 'Insight Engine', icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'yukiboard', label: 'YukiBoard', icon: <Keyboard className="w-3.5 h-3.5" /> },
  { value: 'both', label: '共用', icon: <Zap className="w-3.5 h-3.5" /> },
]

const FEATURES = ['streaming', 'function_calling', 'vision', 'json_mode', 'system_prompt', 'temperature', 'context_window_128k', 'context_window_1m']

// 預設模型清單（用於快速匯入）
const DEFAULT_MODELS: Partial<AiModel>[] = [
  // OpenAI
  { provider: 'openai', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini', category: 'chat', maxTokens: 16384, inputPrice: 0.15, outputPrice: 0.6, platform: 'both', notes: '高性價比、快速' },
  { provider: 'openai', modelId: 'gpt-4o', displayName: 'GPT-4o', category: 'chat', maxTokens: 16384, inputPrice: 2.5, outputPrice: 10, platform: 'both', notes: '多模態旗艦' },
  { provider: 'openai', modelId: 'gpt-4.1', displayName: 'GPT-4.1', category: 'chat', maxTokens: 32768, inputPrice: 2.0, outputPrice: 8, platform: 'insight', notes: '最新旗艦' },
  { provider: 'openai', modelId: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini', category: 'chat', maxTokens: 32768, inputPrice: 0.4, outputPrice: 1.6, platform: 'both', notes: '平衡型' },
  { provider: 'openai', modelId: 'gpt-4.1-nano', displayName: 'GPT-4.1 Nano', category: 'chat', maxTokens: 32768, inputPrice: 0.1, outputPrice: 0.4, platform: 'yukiboard', notes: '極速、超低價' },
  { provider: 'openai', modelId: 'o4-mini', displayName: 'o4 Mini', category: 'chat', maxTokens: 100000, inputPrice: 1.1, outputPrice: 4.4, platform: 'insight', notes: '推理模型' },
  // Anthropic
  { provider: 'anthropic', modelId: 'claude-opus-4-6', displayName: 'Claude Opus 4.6', category: 'chat', maxTokens: 32000, inputPrice: 15, outputPrice: 75, platform: 'insight', notes: '最強推理' },
  { provider: 'anthropic', modelId: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', category: 'chat', maxTokens: 16000, inputPrice: 3, outputPrice: 15, platform: 'both', notes: '均衡型' },
  { provider: 'anthropic', modelId: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5', category: 'chat', maxTokens: 8192, inputPrice: 0.25, outputPrice: 1.25, platform: 'both', notes: '快速、低價' },
  // Google
  { provider: 'google', modelId: 'gemini-2.5-flash-preview-05-20', displayName: 'Gemini 2.5 Flash', category: 'chat', maxTokens: 65536, inputPrice: 0.15, outputPrice: 0.6, platform: 'both', notes: '超快、1M context' },
  { provider: 'google', modelId: 'gemini-2.5-pro-preview-06-05', displayName: 'Gemini 2.5 Pro', category: 'chat', maxTokens: 65536, inputPrice: 1.25, outputPrice: 10, platform: 'insight', notes: '旗艦推理' },
  { provider: 'google', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', category: 'chat', maxTokens: 8192, inputPrice: 0.1, outputPrice: 0.4, platform: 'yukiboard', notes: '極速' },
]

export default function AiModelsPage() {
  const [models, setModels] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')

  // Edit modal
  const [editing, setEditing] = useState<Partial<AiModel> | null>(null)
  const [editApiKey, setEditApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/ai-models')
      if (res.ok) {
        const data = await res.json()
        setModels(data.models ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchModels() }, [fetchModels])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/super-admin/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          provider: editing.provider,
          modelId: editing.modelId,
          displayName: editing.displayName,
          category: editing.category || 'chat',
          apiEndpoint: editing.apiEndpoint || '',
          apiKey: editApiKey || undefined,
          isActive: editing.isActive !== false,
          maxTokens: editing.maxTokens || 4096,
          inputPrice: editing.inputPrice || 0,
          outputPrice: editing.outputPrice || 0,
          supportedFeatures: editing.supportedFeatures || [],
          notes: editing.notes || '',
          platform: editing.platform || 'insight',
        }),
      })
      if (res.ok) {
        setEditing(null)
        setEditApiKey('')
        fetchModels()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    await fetch('/api/super-admin/ai-models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    })
    fetchModels()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/super-admin/ai-models?id=${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchModels()
  }

  const handleImportDefaults = async () => {
    setImporting(true)
    try {
      for (const model of DEFAULT_MODELS) {
        // Skip if already exists
        if (models.some(m => m.provider === model.provider && m.modelId === model.modelId)) continue
        await fetch('/api/super-admin/ai-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        })
      }
      fetchModels()
    } finally {
      setImporting(false)
    }
  }

  // Filtered models
  const filtered = models.filter(m => {
    if (filterPlatform !== 'all' && m.platform !== filterPlatform && m.platform !== 'both') return false
    if (filterProvider !== 'all' && m.provider !== filterProvider) return false
    if (search) {
      const q = search.toLowerCase()
      return m.displayName.toLowerCase().includes(q) || m.modelId.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)
    }
    return true
  })

  // Group by provider
  const grouped = filtered.reduce((acc, m) => {
    const key = m.provider
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, AiModel[]>)

  const providerInfo = (p: string) => PROVIDERS.find(pr => pr.value === p) || { label: p, icon: '🔮', color: '#9ca3af' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="w-7 h-7 text-purple-400" />
            AI 模型管理
          </h1>
          <p className="text-sm text-white/40 mt-1">管理 Insight Engine + YukiBoard 所有 AI 模型與 API 設定</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportDefaults}
            disabled={importing}
            className="px-3 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10"
          >
            {importing ? '匯入中...' : '⚡ 匯入預設模型'}
          </button>
          <button
            onClick={() => setEditing({ isActive: true, platform: 'both', category: 'chat', maxTokens: 4096 })}
            className="px-4 py-2 text-sm rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-all border border-purple-500/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> 新增模型
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '總模型數', value: models.length, color: 'text-blue-400' },
          { label: '啟用中', value: models.filter(m => m.isActive).length, color: 'text-green-400' },
          { label: '有 API Key', value: models.filter(m => m.hasKey).length, color: 'text-yellow-400' },
          { label: 'Provider', value: new Set(models.map(m => m.provider)).size, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-white/30">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋模型名稱 / ID / Provider..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40"
          />
        </div>
        <select
          value={filterPlatform}
          onChange={e => setFilterPlatform(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none"
        >
          <option value="all">所有平台</option>
          <option value="insight">Insight Engine</option>
          <option value="yukiboard">YukiBoard</option>
          <option value="both">共用</option>
        </select>
        <select
          value={filterProvider}
          onChange={e => setFilterProvider(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none"
        >
          <option value="all">所有 Provider</option>
          {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
        </select>
      </div>

      {/* Model list grouped by provider */}
      {loading ? (
        <div className="text-center py-20 text-white/30">載入中...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Server className="w-12 h-12 mx-auto text-white/10 mb-3" />
          <p className="text-white/30">尚無模型設定</p>
          <p className="text-sm text-white/20 mt-1">點擊「匯入預設模型」快速新增</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([provider, provModels]) => {
            const info = providerInfo(provider)
            return (
              <div key={provider}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-lg">{info.icon}</span>
                  <h3 className="text-sm font-bold text-white/60">{info.label}</h3>
                  <span className="text-xs text-white/20 ml-1">{provModels.length} 模型</span>
                </div>
                <div className="grid gap-2">
                  {provModels.map(model => (
                    <div
                      key={model.id}
                      className={`p-4 rounded-xl border transition-all ${model.isActive ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white/[0.01] border-white/[0.04] opacity-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-white">{model.displayName}</span>
                            <code className="text-xs text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{model.modelId}</code>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{
                              borderColor: model.platform === 'yukiboard' ? '#a78bfa40' : model.platform === 'both' ? '#34d39940' : '#60a5fa40',
                              color: model.platform === 'yukiboard' ? '#a78bfa' : model.platform === 'both' ? '#34d399' : '#60a5fa',
                              background: model.platform === 'yukiboard' ? '#a78bfa10' : model.platform === 'both' ? '#34d39910' : '#60a5fa10',
                            }}>
                              {PLATFORMS.find(p => p.value === model.platform)?.label || model.platform}
                            </span>
                            {model.hasKey && <span className="text-[10px] text-green-400/60">🔑</span>}
                          </div>
                          <div className="flex gap-3 mt-1.5 text-xs text-white/25">
                            <span>{CATEGORIES.find(c => c.value === model.category)?.label || model.category}</span>
                            <span>Max {(model.maxTokens / 1000).toFixed(0)}K</span>
                            {(model.inputPrice > 0 || model.outputPrice > 0) && (
                              <span>${model.inputPrice} / ${model.outputPrice} per 1K</span>
                            )}
                            {model.notes && <span className="text-white/15">— {model.notes}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleToggle(model.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                            {model.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button onClick={() => { setEditing(model); setEditApiKey('') }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(model.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] p-6 space-y-4"
            style={{ background: 'rgba(15, 18, 35, 0.95)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">{editing.id ? '編輯模型' : '新增模型'}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1 block">Provider</label>
                <select
                  value={editing.provider || ''}
                  onChange={e => setEditing({ ...editing, provider: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-purple-500/40"
                >
                  <option value="">選擇...</option>
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">平台</label>
                <select
                  value={editing.platform || 'insight'}
                  onChange={e => setEditing({ ...editing, platform: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none"
                >
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1 block">Model ID</label>
                <input
                  value={editing.modelId || ''}
                  onChange={e => setEditing({ ...editing, modelId: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">顯示名稱</label>
                <input
                  value={editing.displayName || ''}
                  onChange={e => setEditing({ ...editing, displayName: e.target.value })}
                  placeholder="GPT-4o Mini"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1 block">類別</label>
                <select
                  value={editing.category || 'chat'}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Max Tokens</label>
                <input
                  type="number"
                  value={editing.maxTokens || 4096}
                  onChange={e => setEditing({ ...editing, maxTokens: parseInt(e.target.value) || 4096 })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/30 mb-1 block">API Endpoint（自訂 / Ollama / Qwen）</label>
              <input
                value={editing.apiEndpoint || ''}
                onChange={e => setEditing({ ...editing, apiEndpoint: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/30 mb-1 block">API Key {editing.hasKey && <span className="text-green-400/50">（已設定，留空不更動）</span>}</label>
              <input
                type="password"
                value={editApiKey}
                onChange={e => setEditApiKey(e.target.value)}
                placeholder={editing.hasKey ? '••••••••（留空不更動）' : '輸入 API Key'}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1 block">Input $/1K tokens</label>
                <input
                  type="number"
                  step="0.001"
                  value={editing.inputPrice || 0}
                  onChange={e => setEditing({ ...editing, inputPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Output $/1K tokens</label>
                <input
                  type="number"
                  step="0.001"
                  value={editing.outputPrice || 0}
                  onChange={e => setEditing({ ...editing, outputPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/30 mb-1 block">備註</label>
              <input
                value={editing.notes || ''}
                onChange={e => setEditing({ ...editing, notes: e.target.value })}
                placeholder="用途說明、注意事項..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">取消</button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.provider || !editing.modelId || !editing.displayName}
                className="px-5 py-2 text-sm rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 disabled:opacity-30 transition-all"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative rounded-2xl border border-white/[0.08] p-6 max-w-sm w-full"
            style={{ background: 'rgba(15, 18, 35, 0.95)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm text-white/70">確定刪除此模型設定？</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-sm text-white/40">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

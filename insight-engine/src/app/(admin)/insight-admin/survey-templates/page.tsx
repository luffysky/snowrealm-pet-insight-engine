'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───

interface TemplateRow {
  id: string
  source: 'platform' | 'tenant' | 'marketplace'
  tenant_id: string | null
  name: string
  description: string | null
  industry: string | null
  icon: string
  tags: string[]
  use_count: number
  rating_sum: number
  rating_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
}

type TabKey = 'platform' | 'tenant' | 'marketplace'

// ─── Constants ───

const TABS: { key: TabKey; label: string }[] = [
  { key: 'platform', label: '🏢 平台模板' },
  { key: 'tenant', label: '🏠 我的模板' },
  { key: 'marketplace', label: '🌐 模板市集' },
]

const INDUSTRIES = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'pet', label: '寵物', icon: '🐾' },
  { key: 'restaurant', label: '餐飲', icon: '🍽️' },
  { key: 'ecommerce', label: '電商', icon: '🛍️' },
  { key: 'saas', label: 'SaaS', icon: '🚀' },
  { key: 'education', label: '教育', icon: '📚' },
  { key: 'hr', label: '人資', icon: '👥' },
  { key: 'general', label: '通用', icon: '⭐' },
]

// ─── Helpers ───

function averageRating(sum: number, count: number): string {
  if (count === 0) return '–'
  return (sum / count).toFixed(1)
}

function industryLabel(key: string | null): string {
  if (!key) return ''
  const found = INDUSTRIES.find((i) => i.key === key)
  return found ? `${found.icon} ${found.label}` : key
}

// ─── TemplateCard ───

function TemplateCard({
  template,
  onUse,
  using,
}: {
  template: TemplateRow
  onUse: (id: string) => void
  using: boolean
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex flex-col gap-3 hover:border-slate-500 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{template.icon}</span>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{template.name}</h3>
            {template.industry && (
              <span className="text-xs text-slate-500 mt-0.5 block">{industryLabel(template.industry)}</span>
            )}
          </div>
        </div>
        {template.is_featured && (
          <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
            精選
          </span>
        )}
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{template.description}</p>
      )}

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>使用 {template.use_count} 次</span>
          {template.rating_count > 0 && (
            <span>⭐ {averageRating(template.rating_sum, template.rating_count)}</span>
          )}
        </div>
        <button
          onClick={() => onUse(template.id)}
          disabled={using}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {using ? '建立中…' : '使用'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ───

export default function SurveyTemplatesPage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabKey>('platform')
  const [industry, setIndustry] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(false)
  const [usingId, setUsingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // ── Fetch ──
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ source: activeTab })
      if (industry !== 'all') params.set('industry', industry)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/survey-templates?${params.toString()}`)
      if (res.ok) {
        const json = await res.json() as { data: TemplateRow[] }
        setTemplates(json.data ?? [])
      }
    } catch (err) {
      console.error('[survey-templates]', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, industry, search])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Use template ──
  async function handleUse(templateId: string) {
    if (usingId) return
    setUsingId(templateId)
    try {
      const res = await fetch(`/api/admin/survey-templates/${templateId}/use`, {
        method: 'POST',
      })
      const data = await res.json() as { surveyId?: string; slug?: string; error?: string }
      if (!res.ok) {
        setToast(data.error ?? '建立失敗')
        return
      }
      setToast('問卷已建立！正在跳轉…')
      setTimeout(() => router.push('/surveys'), 1200)
    } catch {
      setToast('網路錯誤，請重試')
    } finally {
      setUsingId(null)
    }
  }

  // ── Search submit ──
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  // ── Tab change resets industry / search ──
  function handleTabChange(tab: TabKey) {
    setActiveTab(tab)
    setIndustry('all')
    setSearch('')
    setSearchInput('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📋 問卷模板</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Industry filter + search */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.key}
              onClick={() => setIndustry(ind.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                industry === ind.key
                  ? 'bg-emerald-700/60 text-emerald-300 border border-emerald-600/50'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500'
              }`}
            >
              {ind.icon} {ind.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋模板名稱或說明…"
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-slate-500"
          />
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            搜尋
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput('') }}
              className="text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              清除
            </button>
          )}
        </form>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="text-slate-400 animate-pulse py-8 text-center">載入中…</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg">
            {activeTab === 'tenant'
              ? '你還沒有建立任何模板'
              : activeTab === 'marketplace'
              ? '目前市集沒有公開模板'
              : '找不到符合條件的模板'}
          </p>
          {activeTab === 'tenant' && (
            <p className="text-sm mt-2 text-slate-600">
              在問卷管理頁面，點選問卷設定中的「存為模板」即可建立
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
              using={usingId === template.id}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 border border-slate-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}

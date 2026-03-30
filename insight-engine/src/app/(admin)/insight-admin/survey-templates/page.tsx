'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CHAT_BACKGROUNDS, type BgId, type ChatBgDef } from '@/components/admin/chat-bg'

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

interface StickerPack {
  id: string
  name: string
  coverUrl: string | null
  sortOrder: number
  stickers: { id: string; url: string }[]
}

type TabKey = 'platform' | 'tenant' | 'marketplace'
type Category = 'templates' | 'backgrounds' | 'stickers'

// ─── Constants ───

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'templates', label: '📋 問卷模板' },
  { key: 'backgrounds', label: '🎨 聊天背景' },
  { key: 'stickers', label: '😄 貼圖包' },
]

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
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-5 flex flex-col gap-3 hover:border-[#b8a9e8]/35 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{template.icon}</span>
          <div>
            <h3 className="font-semibold text-[#3d3155] text-sm leading-tight">{template.name}</h3>
            {template.industry && (
              <span className="text-xs text-[#3d3155]/60 mt-0.5 block">{industryLabel(template.industry)}</span>
            )}
          </div>
        </div>
        {template.is_featured && (
          <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
            精選
          </span>
        )}
      </div>

      {template.description && (
        <p className="text-xs text-[#8a7ca8] leading-relaxed line-clamp-3">{template.description}</p>
      )}

      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] bg-[#b8a9e8]/10/60 text-[#8a7ca8] px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-3 text-xs text-[#3d3155]/60">
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

// ─── BgPreview (CSS-only static preview) ───

const BG_PREVIEW_STYLE: Record<string, React.CSSProperties> = {
  default:  { background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)' },
  ocean:    { background: 'linear-gradient(135deg,#0c4a6e,#075985,#0369a1)' },
  sakura:   { background: 'linear-gradient(135deg,#500724,#831843,#9d174d)' },
  cyber:    { background: 'linear-gradient(135deg,#0a0a1a,#0d0d2b,#1a0a3a)' },
  forest:   { background: 'linear-gradient(135deg,#052e16,#064e3b,#065f46)' },
  sunset:   { background: 'linear-gradient(135deg,#7c2d12,#9a3412,#c2410c,#ea580c)' },
  night:    { background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)' },
  amber:    { background: 'linear-gradient(135deg,#451a03,#78350f,#92400e)' },
  candy:    { background: 'linear-gradient(135deg,#4a044e,#701a75,#86198f)' },
  stars:    { background: 'linear-gradient(180deg,#020b18,#050d25)' },
  geo:      { background: 'linear-gradient(180deg,#0f0a1e,#1a0a2e)' },
  wave:     { background: 'linear-gradient(180deg,#000d1a,#001a33)' },
  snow:     { background: 'linear-gradient(180deg,#0a1628,#0d2040)' },
}

function BgCard({
  def,
  owned,
  balance,
  onPurchase,
  purchasing,
}: {
  def: ChatBgDef
  owned: boolean
  balance: number
  onPurchase: (def: ChatBgDef) => void
  purchasing: boolean
}) {
  const previewStyle = BG_PREVIEW_STYLE[def.id] ?? { background: '#1e293b' }
  const isFree = def.price === 0
  const canAfford = balance >= def.price

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl overflow-hidden hover:border-[#b8a9e8]/35 transition-colors flex flex-col">
      {/* Preview */}
      <div className="h-24 relative" style={previewStyle}>
        {def.isThree && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-purple-600/80 text-white px-1.5 py-0.5 rounded">
            3D
          </span>
        )}
        {(isFree || owned) && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-emerald-600/80 text-white px-1.5 py-0.5 rounded">
            {owned && !isFree ? '已擁有' : '免費'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex items-center justify-between gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-[#3d3155]">{def.emoji} {def.name}</p>
          {!isFree && (
            <p className="text-xs text-amber-400 mt-0.5">💰 {def.price} Z幣</p>
          )}
        </div>

        {isFree ? (
          <span className="text-xs text-emerald-400 font-medium">免費</span>
        ) : owned ? (
          <span className="text-xs text-[#8a7ca8]">✓ 已購</span>
        ) : (
          <button
            onClick={() => onPurchase(def)}
            disabled={purchasing || !canAfford}
            title={!canAfford ? `Z幣不足（現有 ${balance}）` : undefined}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {purchasing ? '…' : '購買'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── StickerPackCard ───

function StickerPackCard({ pack }: { pack: StickerPack }) {
  const [expanded, setExpanded] = useState(false)
  const preview = pack.stickers.slice(0, 6)

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-4 flex flex-col gap-3 hover:border-[#b8a9e8]/35 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#3d3155] text-sm">{pack.name}</h3>
        <span className="text-xs text-emerald-400">✓ 已解鎖</span>
      </div>

      {/* Preview grid */}
      <div className="grid grid-cols-3 gap-2">
        {preview.map((s) => (
          <div key={s.id} className="aspect-square bg-[#b8a9e8]/10 rounded-lg overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt="sticker" className="w-full h-full object-contain p-1" loading="lazy" />
          </div>
        ))}
      </div>

      {pack.stickers.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#8a7ca8] hover:text-[#3d3155] transition-colors text-left cursor-pointer"
        >
          {expanded ? '收起' : `還有 ${pack.stickers.length - 6} 張 →`}
        </button>
      )}

      {expanded && (
        <div className="grid grid-cols-4 gap-2 mt-1">
          {pack.stickers.slice(6).map((s) => (
            <div key={s.id} className="aspect-square bg-[#b8a9e8]/10 rounded-lg overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="sticker" className="w-full h-full object-contain p-1" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#3d3155]/60">{pack.stickers.length} 張貼圖</p>
    </div>
  )
}

// ─── Page ───

const BG_OWNED_KEY = 'insight_chat_bg_owned'

export default function SurveyTemplatesPage() {
  const router = useRouter()

  // Category
  const [category, setCategory] = useState<Category>('templates')

  // Templates state
  const [activeTab, setActiveTab] = useState<TabKey>('platform')
  const [industry, setIndustry] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [usingId, setUsingId] = useState<string | null>(null)

  // Backgrounds state
  const [bgOwned, setBgOwned] = useState<Set<BgId>>(new Set())
  const [zcoinBalance, setZcoinBalance] = useState(0)
  const [purchasingBgId, setPurchasingBgId] = useState<BgId | null>(null)

  // Stickers state
  const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([])
  const [loadingStickers, setLoadingStickers] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // ── Load background ownership + balance ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BG_OWNED_KEY)
      if (raw) setBgOwned(new Set(JSON.parse(raw) as BgId[]))
    } catch { /* ignore */ }

    fetch('/api/zcoin').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.balance != null) setZcoinBalance(data.balance)
    }).catch(() => {})
  }, [])

  // ── Fetch templates ──
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true)
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
      setLoadingTemplates(false)
    }
  }, [activeTab, industry, search])

  useEffect(() => {
    if (category === 'templates') fetchTemplates()
  }, [category, fetchTemplates])

  // ── Fetch stickers ──
  useEffect(() => {
    if (category !== 'stickers') return
    setLoadingStickers(true)
    fetch('/api/stickers').then(r => r.ok ? r.json() : { packs: [] }).then(data => {
      setStickerPacks(data.packs ?? [])
    }).catch(() => {}).finally(() => setLoadingStickers(false))
  }, [category])

  // ── Use template ──
  async function handleUse(templateId: string) {
    if (usingId) return
    setUsingId(templateId)
    try {
      const res = await fetch(`/api/admin/survey-templates/${templateId}/use`, { method: 'POST' })
      const data = await res.json() as { surveyId?: string; slug?: string; error?: string }
      if (!res.ok) { showToast(data.error ?? '建立失敗'); return }
      showToast('問卷已建立！正在跳轉…')
      setTimeout(() => router.push('/surveys'), 1200)
    } catch {
      showToast('網路錯誤，請重試')
    } finally {
      setUsingId(null)
    }
  }

  // ── Purchase background ──
  async function handleBgPurchase(def: ChatBgDef) {
    if (purchasingBgId) return
    setPurchasingBgId(def.id as BgId)
    try {
      const res = await fetch('/api/zcoin/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: def.price, reason: 'decoration', referenceId: `bg_${def.id}` }),
      })
      const data = await res.json() as { ok?: boolean; newBalance?: number; error?: string }
      if (!data.ok) { showToast(data.error ?? '購買失敗'); return }
      const next = new Set(bgOwned)
      next.add(def.id as BgId)
      setBgOwned(next)
      localStorage.setItem(BG_OWNED_KEY, JSON.stringify([...next]))
      if (data.newBalance != null) setZcoinBalance(data.newBalance)
      showToast(`✅ 已購買「${def.name}」背景！`)
    } catch {
      showToast('網路錯誤，請重試')
    } finally {
      setPurchasingBgId(null)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab)
    setIndustry('all')
    setSearch('')
    setSearchInput('')
  }

  const freeBgs = CHAT_BACKGROUNDS.filter(b => b.price === 0)
  const paidBgs = CHAT_BACKGROUNDS.filter(b => b.price > 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">🏪 內容市集</h1>
        <div className="text-xs text-amber-400">💰 Z幣餘額：{zcoinBalance}</div>
      </div>

      {/* Category switcher */}
      <div className="flex gap-1 bg-white/35 backdrop-blur-sm p-1 rounded-xl w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              category === cat.key
                ? 'bg-[#b8a9e8]/25 text-[#6b5fa8]'
                : 'text-[#8a7ca8] hover:text-[#3d3155]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── TEMPLATES ── */}
      {category === 'templates' && (
        <div className="space-y-5">
          {/* Template tabs */}
          <div className="flex gap-1 bg-white/30 p-1 rounded-lg w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.key ? 'bg-[#b8a9e8]/25 text-[#6b5fa8]' : 'text-[#8a7ca8] hover:text-[#3d3155]'
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
                      : 'bg-white/40 backdrop-blur-sm text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155] hover:border-[#b8a9e8]/35'
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
                className="flex-1 bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] placeholder:text-[#b5a8d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#b8a9e8]/35"
              />
              <button type="submit" className="bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                搜尋
              </button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput('') }} className="text-[#8a7ca8] hover:text-[#3d3155] px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                  清除
                </button>
              )}
            </form>
          </div>

          {loadingTemplates ? (
            <div className="text-[#8a7ca8] animate-pulse py-8 text-center">載入中…</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 text-[#3d3155]/60">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg">
                {activeTab === 'tenant' ? '你還沒有建立任何模板'
                  : activeTab === 'marketplace' ? '目前市集沒有公開模板'
                  : '找不到符合條件的模板'}
              </p>
              {activeTab === 'tenant' && (
                <p className="text-sm mt-2 text-slate-600">在問卷管理頁面，點選問卷設定中的「存為模板」即可建立</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onUse={handleUse} using={usingId === template.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BACKGROUNDS ── */}
      {category === 'backgrounds' && (
        <div className="space-y-4 sm:space-y-6">
          <p className="text-sm text-[#8a7ca8]">在私訊聊天室中使用的動態背景。付費背景購買後永久解鎖，可隨時切換。</p>

          {/* Free */}
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">🆓 免費背景</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {freeBgs.map((def) => (
                <BgCard
                  key={def.id}
                  def={def}
                  owned
                  balance={zcoinBalance}
                  onPurchase={handleBgPurchase}
                  purchasing={purchasingBgId === def.id}
                />
              ))}
            </div>
          </div>

          {/* Paid */}
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">💰 付費背景</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {paidBgs.map((def) => (
                <BgCard
                  key={def.id}
                  def={def}
                  owned={bgOwned.has(def.id as BgId)}
                  balance={zcoinBalance}
                  onPurchase={handleBgPurchase}
                  purchasing={purchasingBgId === def.id}
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span>購買後可在私訊頁面的調色盤圖示切換背景</span>
            <span className="text-purple-400">（標記 3D 為 Three.js 動態效果）</span>
          </div>
        </div>
      )}

      {/* ── STICKERS ── */}
      {category === 'stickers' && (
        <div className="space-y-5">
          <p className="text-sm text-[#8a7ca8]">在私訊聊天室中使用的貼圖包。由平台提供，登入後即可使用。</p>

          {loadingStickers ? (
            <div className="text-[#8a7ca8] animate-pulse py-8 text-center">載入中…</div>
          ) : stickerPacks.length === 0 ? (
            <div className="text-center py-16 text-[#3d3155]/60">
              <div className="text-5xl mb-4">😄</div>
              <p>目前沒有可用的貼圖包</p>
              <p className="text-sm mt-2 text-slate-600">Super Admin 可在控制台新增貼圖包</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stickerPacks.map((pack) => (
                <StickerPackCard key={pack.id} pack={pack} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/60 border border-[#b8a9e8]/30 text-[#3d3155] px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}

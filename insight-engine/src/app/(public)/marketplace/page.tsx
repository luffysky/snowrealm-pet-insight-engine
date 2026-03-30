'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Star, Check, Loader2, Search } from 'lucide-react'

type ItemType = 'all' | 'sticker_pack' | 'background' | 'theme' | 'emoji_pack' | 'survey_template'

interface MarketItem {
  id: string
  type: string
  name: string
  description: string | null
  preview_url: string | null
  price_zcoin: number
  creator_name: string | null
  ref_id: string | null
  is_featured: boolean
  is_official: boolean
  purchase_count: number
  ratingAvg: number
  tags: string[]
  isOwned: boolean
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  sticker_pack:    { label: '貼圖包',  emoji: '🎨', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  background:      { label: '背景',    emoji: '🖼️', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  theme:           { label: '主題',    emoji: '🎭', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  emoji_pack:      { label: '表情貼',  emoji: '😊', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  survey_template: { label: '問卷模板', emoji: '📋', color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<ItemType>('all')
  const [search, setSearch] = useState('')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [zcoinBalance, setZcoinBalance] = useState(0)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const loadItems = async (type?: string) => {
    setLoading(true)
    try {
      const url = type && type !== 'all' ? `/api/marketplace?type=${type}` : '/api/marketplace'
      const res = await fetch(url)
      const data = await res.json() as { items: MarketItem[] }
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    void loadItems(typeFilter !== 'all' ? typeFilter : undefined)
    // Load zcoin balance
    fetch('/api/zcoin').then(r => r.ok ? r.json() as Promise<{ balance?: number }> : null).then(d => {
      if (d?.balance !== undefined) setZcoinBalance(d.balance)
    }).catch(() => {})
  }, [typeFilter])

  const purchase = async (item: MarketItem) => {
    if (item.isOwned) return
    if (item.price_zcoin > zcoinBalance) { showToast('err', 'Z幣不足，請先儲值'); return }
    if (!confirm(`確定購買「${item.name}」（${item.price_zcoin === 0 ? '免費' : `${item.price_zcoin} Z幣`}）？`)) return
    setPurchasing(item.id)
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      })
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, isOwned: true } : i))
        setZcoinBalance(b => b - item.price_zcoin)
        showToast('ok', `「${item.name}」已加入收藏！`)
      } else {
        const d = await res.json() as { error?: string }
        showToast('err', d.error ?? '購買失敗')
      }
    } finally { setPurchasing(null) }
  }

  const TYPES: { key: ItemType; label: string; emoji: string }[] = [
    { key: 'all', label: '全部', emoji: '🛍️' },
    { key: 'sticker_pack', label: '貼圖包', emoji: '🎨' },
    { key: 'background', label: '背景', emoji: '🖼️' },
    { key: 'theme', label: '主題', emoji: '🎭' },
    { key: 'emoji_pack', label: '表情貼', emoji: '😊' },
    { key: 'survey_template', label: '問卷模板', emoji: '📋' },
  ]

  const filtered = items.filter(i =>
    !search || i.name.includes(search) || (i.description?.includes(search) ?? false)
  )

  return (
    <div className="min-h-screen text-[#3d3155]" style={{ background: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)', fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-transparent/95 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-violet-400" />
              <h1 className="text-xl font-bold">SnowRealm 市集</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-xs text-amber-700 font-semibold">{zcoinBalance} Z幣</span>
            </div>
          </div>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5a8d0]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋商品..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-[#3d3155] placeholder-white/25 outline-none focus:border-violet-400/40"
            />
          </div>
          {/* Type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  typeFilter === t.key
                    ? 'bg-violet-500/20 text-violet-700 border border-violet-500/30'
                    : 'text-[#8a7ca8] hover:text-[#3d3155] border border-[#b8a9e8]/25'
                }`}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-xl ${
          toast.type === 'ok' ? 'bg-emerald-500 text-[#3d3155]' : 'bg-red-500 text-[#3d3155]'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Featured section */}
        {typeFilter === 'all' && !search && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#8a7ca8] mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-600" fill="currentColor" /> 精選推薦
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.filter(i => i.is_featured).slice(0, 6).map(item => (
                <ItemCard key={item.id} item={item} purchasing={purchasing} onPurchase={purchase} />
              ))}
            </div>
          </div>
        )}

        {/* All items */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>沒有符合條件的商品</p>
          </div>
        ) : (
          <>
            {(typeFilter !== 'all' || search) && (
              <h2 className="text-sm font-semibold text-[#8a7ca8] mb-3">{filtered.length} 件商品</h2>
            )}
            {typeFilter === 'all' && !search && (
              <h2 className="text-sm font-semibold text-[#8a7ca8] mb-3">全部商品</h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(item => (
                <ItemCard key={item.id} item={item} purchasing={purchasing} onPurchase={purchase} />
              ))}
            </div>
          </>
        )}

        {/* Creator CTA */}
        <div className="mt-12 p-6 bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl text-center">
          <h3 className="text-base font-bold text-[#3d3155] mb-2">想成為創作者？</h3>
          <p className="text-sm text-slate-400 mb-4">上傳你的貼圖包、背景，每次銷售獲得 <span className="text-amber-700 font-semibold">70% Z幣分潤</span></p>
          <a href="/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-[#3d3155] font-semibold rounded-xl text-sm transition-colors">
            聯繫管理員申請
          </a>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, purchasing, onPurchase }: {
  item: MarketItem
  purchasing: string | null
  onPurchase: (item: MarketItem) => void
}) {
  const typeInfo = TYPE_LABELS[item.type]
  const isBuying = purchasing === item.id

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] ${
      item.is_featured ? 'border-amber-500/30' : 'border-white/8'
    } bg-slate-900/60`}>
      {/* Preview */}
      <div className="aspect-square bg-slate-800 overflow-hidden">
        {item.preview_url ? (
          <img src={item.preview_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {typeInfo?.emoji ?? '📦'}
          </div>
        )}
        {item.is_featured && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-3 h-3 text-[#3d3155]" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-semibold text-sm text-[#3d3155] truncate flex-1">{item.name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${typeInfo?.color ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
            {typeInfo?.label ?? item.type}
          </span>
        </div>
        {item.description && (
          <p className="text-[11px] text-slate-500 truncate mb-2">{item.description}</p>
        )}
        {item.creator_name && (
          <p className="text-[10px] text-slate-600 mb-2">by {item.creator_name}</p>
        )}

        {/* Buy button */}
        <button
          onClick={() => onPurchase(item)}
          disabled={item.isOwned || isBuying}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            item.isOwned
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
              : item.price_zcoin === 0
              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20 hover:bg-blue-500/25'
              : 'bg-violet-500/15 text-violet-300 border border-violet-500/20 hover:bg-violet-500/25'
          }`}
        >
          {isBuying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : item.isOwned ? (
            <><Check className="w-3.5 h-3.5" /> 已擁有</>
          ) : item.price_zcoin === 0 ? (
            '免費領取'
          ) : (
            `${item.price_zcoin} Z幣`
          )}
        </button>
      </div>
    </div>
  )
}

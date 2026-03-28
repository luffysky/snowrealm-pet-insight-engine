'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Trash2, Eye, EyeOff, Star, Edit2, Check, X, Loader2 } from 'lucide-react'

type ItemType = 'all' | 'sticker_pack' | 'background' | 'theme' | 'emoji_pack' | 'survey_template'

interface MarketItem {
  id: string
  type: string
  name: string
  description: string | null
  preview_url: string | null
  price_zcoin: number
  creator_name: string | null
  creator_revenue_pct: number
  ref_id: string | null
  is_active: boolean
  is_featured: boolean
  is_official: boolean
  purchase_count: number
  ratingAvg: number
  sort_order: number
  created_at: string
  tags: string[]
}

const TYPE_LABELS: Record<string, string> = {
  sticker_pack: '🎨 貼圖包',
  background: '🖼️ 背景',
  theme: '🎭 主題',
  emoji_pack: '😊 表情貼',
  survey_template: '📋 問卷模板',
}

const TYPE_COLORS: Record<string, string> = {
  sticker_pack: 'bg-amber-500/15 text-amber-400',
  background: 'bg-blue-500/15 text-blue-400',
  theme: 'bg-purple-500/15 text-purple-400',
  emoji_pack: 'bg-emerald-500/15 text-emerald-400',
  survey_template: 'bg-rose-500/15 text-rose-400',
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<ItemType>('all')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editingPriceVal, setEditingPriceVal] = useState('')
  const [savingPrice, setSavingPrice] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ type: 'background', name: '', description: '', priceZcoin: '0', refId: '', isOfficial: true })
  const [adding, setAdding] = useState(false)

  const loadItems = async (type?: string) => {
    setLoading(true)
    try {
      const url = type && type !== 'all' ? `/api/super-admin/marketplace?type=${type}` : '/api/super-admin/marketplace'
      const res = await fetch(url)
      const data = await res.json() as { items: MarketItem[] }
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadItems(typeFilter !== 'all' ? typeFilter : undefined) }, [typeFilter])

  const toggleActive = async (item: MarketItem) => {
    await fetch('/api/super-admin/marketplace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
    })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
  }

  const toggleFeatured = async (item: MarketItem) => {
    await fetch('/api/super-admin/marketplace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isFeatured: !item.is_featured }),
    })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i))
  }

  const savePrice = async (id: string) => {
    const price = parseInt(editingPriceVal)
    if (isNaN(price) || price < 0) return
    setSavingPrice(id)
    try {
      await fetch('/api/super-admin/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, priceZcoin: price }),
      })
      setItems(prev => prev.map(i => i.id === id ? { ...i, price_zcoin: price } : i))
      setEditingPrice(null)
    } finally { setSavingPrice(null) }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('確定刪除這個商品？')) return
    await fetch(`/api/super-admin/marketplace?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/super-admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: addForm.type,
          name: addForm.name.trim(),
          description: addForm.description.trim() || undefined,
          priceZcoin: parseInt(addForm.priceZcoin) || 0,
          refId: addForm.refId.trim() || undefined,
          isOfficial: addForm.isOfficial,
        }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setAddForm({ type: 'background', name: '', description: '', priceZcoin: '0', refId: '', isOfficial: true })
        await loadItems(typeFilter !== 'all' ? typeFilter : undefined)
      }
    } finally { setAdding(false) }
  }

  const TYPES: { key: ItemType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'sticker_pack', label: '🎨 貼圖包' },
    { key: 'background', label: '🖼️ 背景' },
    { key: 'theme', label: '🎭 主題' },
    { key: 'emoji_pack', label: '😊 表情貼' },
    { key: 'survey_template', label: '📋 模板' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">市集管理</h1>
            <p className="text-sm text-slate-400">管理貼圖、背景、主題、問卷模板的上下架與定價</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增商品
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">新增市集商品</h2>
          <form onSubmit={e => void handleAdd(e)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">類型</label>
                <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-violet-500/50">
                  <option value="sticker_pack">貼圖包</option>
                  <option value="background">背景</option>
                  <option value="theme">主題</option>
                  <option value="emoji_pack">表情貼</option>
                  <option value="survey_template">問卷模板</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">名稱 *</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="商品名稱"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Z幣售價</label>
                <input type="number" min={0} value={addForm.priceZcoin} onChange={e => setAddForm(f => ({ ...f, priceZcoin: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Ref ID（背景 key / 貼圖包 ID 等）</label>
                <input value={addForm.refId} onChange={e => setAddForm(f => ({ ...f, refId: e.target.value }))}
                  placeholder="例: ocean / sakura"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 mb-1.5 block">說明</label>
                <input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="商品說明（選填）"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm.isOfficial} onChange={e => setAddForm(f => ({ ...f, isOfficial: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-slate-300">平台官方商品</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={adding || !addForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? '建立中...' : '建立商品'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 創作者格式說明 */}
      <details className="bg-slate-900/40 border border-slate-700/40 rounded-2xl">
        <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2">
          📐 創作者投稿格式規範
        </summary>
        <div className="px-5 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
          {[
            { icon: '🎨', title: '貼圖包', lines: ['每張 512×512px PNG/WebP（透明背景）', '每包 8–40 張','ZIP 壓縮，不超過 50MB', '檔名用數字排序：01.png, 02.png...'] },
            { icon: '😊', title: '表情貼', lines: ['每張 240×240px PNG/WebP（透明背景）', '每包 8–24 張','ZIP 壓縮，不超過 20MB', '建議正方形，表情清晰'] },
            { icon: '🖼️', title: '背景圖', lines: ['1080×1920px JPG/WebP（建議）', '最小 800×1400px', '檔案不超過 5MB', '深色調較佳（避免遮蓋訊息泡泡）'] },
            { icon: '🎭', title: '主題', lines: ['需提供 JSON 設定檔（向管理員索取範本）', '包含：bg, myBg, myText, theirBg, theirText', '只接受管理員審核後手動新增', '需附上 2 張預覽截圖'] },
          ].map(cat => (
            <div key={cat.title} className="bg-slate-800/50 rounded-xl p-3">
              <p className="font-semibold text-slate-200 mb-2">{cat.icon} {cat.title}</p>
              <ul className="space-y-1">
                {cat.lines.map((l, i) => <li key={i}>• {l}</li>)}
              </ul>
            </div>
          ))}
          <div className="sm:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="font-semibold text-amber-300 mb-1">💰 分潤機制</p>
            <p>每筆銷售 <span className="text-amber-200 font-medium">70% Z幣</span> 歸創作者，30% 平台手續費。創作者 Z幣可兌換平台禮品或提現（每月結算）。投稿請聯繫平台管理員審核上架。</p>
          </div>
        </div>
      </details>

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setTypeFilter(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${typeFilter === t.key ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-slate-200 border border-slate-700/50'}`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{items.length} 筆商品</span>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>尚無商品</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`bg-slate-900/60 border rounded-2xl p-4 flex items-center gap-4 ${item.is_active ? 'border-slate-700/50' : 'border-slate-800/30 opacity-60'}`}>
              {/* Preview swatch */}
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                {item.preview_url
                  ? <img src={item.preview_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">{TYPE_LABELS[item.type]?.slice(0,2) ?? '📦'}</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{item.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] ?? 'bg-slate-700 text-slate-400'}`}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  {item.is_official && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">官方</span>}
                  {item.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">精選</span>}
                  {item.ref_id && <span className="text-[10px] text-slate-600 font-mono">ref:{item.ref_id}</span>}
                </div>
                {item.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{item.purchase_count} 次購買</span>
                  {item.creator_name && <span className="text-xs text-slate-500">創作者：{item.creator_name} ({item.creator_revenue_pct}%)</span>}
                </div>
              </div>

              {/* Price editing */}
              <div className="flex items-center gap-1 shrink-0">
                {editingPrice === item.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0} value={editingPriceVal}
                      onChange={e => setEditingPriceVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void savePrice(item.id); if (e.key === 'Escape') setEditingPrice(null) }}
                      className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white text-center outline-none focus:border-violet-500"
                      autoFocus
                    />
                    <span className="text-xs text-amber-300">Z</span>
                    <button onClick={() => void savePrice(item.id)} disabled={savingPrice === item.id}
                      className="p-1 text-emerald-400 hover:text-emerald-300">
                      {savingPrice === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditingPrice(null)} className="p-1 text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingPrice(item.id); setEditingPriceVal(String(item.price_zcoin)) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs text-amber-300 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    {item.price_zcoin === 0 ? '免費' : `${item.price_zcoin} Z`}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => void toggleFeatured(item)}
                  title={item.is_featured ? '取消精選' : '設為精選'}
                  className={`p-2 rounded-xl transition-colors ${item.is_featured ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                  <Star className="w-4 h-4" fill={item.is_featured ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => void toggleActive(item)}
                  title={item.is_active ? '下架' : '上架'}
                  className={`p-2 rounded-xl transition-colors ${item.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => void deleteItem(item.id)}
                  className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

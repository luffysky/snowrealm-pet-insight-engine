'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'

interface StoryWallItem {
  responseId: string
  surveyTitle: string
  shareableOneLiner: string
  groupComparisons: string[]
  createdAt: string
  isPinned?: boolean
}

type FilterTab = 'all' | 'public' | 'pending' | 'hidden'

const TAB_LABELS: Record<FilterTab, string> = {
  all: '全部',
  public: '已公開',
  pending: '待審核',
  hidden: '已隱藏',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function shortId(responseId: string): string {
  return responseId.slice(0, 8).toUpperCase()
}

function thisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function StoryWallAdminPage() {
  const { selectedSurvey } = useAdminSurvey()

  const [items, setItems] = useState<StoryWallItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const surveySlug = selectedSurvey?.slug ?? null

  const fetchItems = useCallback(async () => {
    if (!surveySlug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/story-wall?surveySlug=${encodeURIComponent(surveySlug)}&pageSize=50`)
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('[story-wall] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [surveySlug])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleAction = async (responseId: string, action: 'pin' | 'unpin' | 'hide') => {
    setActionLoading(responseId + action)
    try {
      await fetch('/api/admin/story-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, action }),
      })
      await fetchItems()
    } catch (err) {
      console.error('[story-wall] action error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyLink = () => {
    if (!surveySlug) return
    const url = `${window.location.origin}/story-wall/${surveySlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const handlePreview = () => {
    if (!surveySlug) return
    window.open(`/story-wall/${surveySlug}`, '_blank')
  }

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true
    if (activeTab === 'public') return !item.isPinned
    if (activeTab === 'pending') return false
    if (activeTab === 'hidden') return false
    return true
  })

  const thisMonthCount = items.filter((item) => thisMonth(item.createdAt)).length

  if (!surveySlug) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">故事牆管理</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-[#8a7ca8]">
          請先從上方選擇一份問卷以查看故事牆內容。
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 頁面標題列 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">📖 故事牆管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] text-sm rounded-lg border border-[#b8a9e8]/25 transition-colors"
          >
            {copySuccess ? '✅ 已複製' : '📋 複製故事牆連結'}
          </button>
          <button
            onClick={handlePreview}
            className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
          >
            🌐 預覽公開故事牆
          </button>
        </div>
      </div>

      {/* 統計卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-[#8a7ca8] mb-1">總故事數</p>
          <p className="text-xl sm:text-2xl font-bold text-[#3d3155]">{total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-[#8a7ca8] mb-1">本月新增</p>
          <p className="text-2xl font-bold text-emerald-400">{thisMonthCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-[#8a7ca8] mb-1">問卷</p>
          <p className="text-sm font-medium text-slate-300 truncate">{selectedSurvey?.title ?? '—'}</p>
        </div>
      </div>

      {/* 篩選 Tab */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
        {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#b8a9e8]/25 text-[#6b5fa8]'
                : 'text-[#8a7ca8] hover:text-[#3d3155]'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* 故事列表 */}
      {loading ? (
        <p className="text-[#8a7ca8] animate-pulse">載入中…</p>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-[#8a7ca8]">
          {activeTab === 'all' ? '目前沒有故事卡片。填答者完成問卷並同意分享後會顯示在這裡。' : `沒有「${TAB_LABELS[activeTab]}」的故事。`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <StoryCard
              key={item.responseId}
              item={item}
              actionLoading={actionLoading}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* 底部預覽按鈕 */}
      {filteredItems.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={handlePreview}
            className="px-6 py-2.5 bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] text-sm rounded-xl border border-[#b8a9e8]/25 transition-colors"
          >
            🌐 前往公開故事牆頁面
          </button>
        </div>
      )}
    </div>
  )
}

interface StoryCardProps {
  item: StoryWallItem
  actionLoading: string | null
  onAction: (responseId: string, action: 'pin' | 'unpin' | 'hide') => Promise<void>
}

function StoryCard({ item, actionLoading, onAction }: StoryCardProps) {
  const isPinBusy = actionLoading === item.responseId + 'pin' || actionLoading === item.responseId + 'unpin'
  const isHideBusy = actionLoading === item.responseId + 'hide'

  return (
    <div className={`bg-white/5 border rounded-xl p-4 flex items-start justify-between gap-4 transition-colors ${
      item.isPinned ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-mono text-[#3d3155]/60">#{shortId(item.responseId)}</span>
          {item.isPinned && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              📌 置頂
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            公開
          </span>
        </div>
        <p className="text-sm text-slate-300 truncate">{item.shareableOneLiner}</p>
        <p className="text-xs text-[#3d3155]/60 mt-1">{formatDate(item.createdAt)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`/story/${item.responseId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 text-xs bg-[#b8a9e8]/12 hover:bg-[#b8a9e8]/15 text-slate-300 rounded-lg border border-white/10 transition-colors"
        >
          查看
        </a>
        <button
          onClick={() => onAction(item.responseId, item.isPinned ? 'unpin' : 'pin')}
          disabled={isPinBusy}
          className="px-2.5 py-1.5 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg border border-amber-500/20 transition-colors disabled:opacity-50"
        >
          {isPinBusy ? '…' : item.isPinned ? '取消置頂' : '置頂'}
        </button>
        <button
          onClick={() => onAction(item.responseId, 'hide')}
          disabled={isHideBusy}
          className="px-2.5 py-1.5 text-xs bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
        >
          {isHideBusy ? '…' : '隱藏'}
        </button>
      </div>
    </div>
  )
}

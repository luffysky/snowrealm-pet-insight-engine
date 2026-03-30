'use client'

import { useEffect, useState, useCallback } from 'react'

type ModerationTab = 'pending' | 'reported' | 'resolved'
type ModerationAction = 'pass' | 'delete' | 'warn' | 'ban' | 'dismiss'

interface ModerationItem {
  id: string
  content_type: string
  content_id: string
  content_preview: string | null
  author_id: string | null
  ai_categories: Record<string, number> | null
  ai_confidence: number | null
  ai_action: string | null
  status: string
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  story: '📖 故事',
  comment: '💬 留言',
  message: '✉️ 私訊',
  image: '📷 圖片',
}

const ACTION_BTNS: { action: ModerationAction; label: string; cls: string }[] = [
  { action: 'pass', label: '✅ 通過', cls: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { action: 'delete', label: '❌ 刪除', cls: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { action: 'warn', label: '⚠️ 警告', cls: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' },
  { action: 'ban', label: '🚫 封鎖', cls: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
]

export default function ModerationPage() {
  const [tab, setTab] = useState<ModerationTab>('pending')
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/moderation?tab=${tab}`)
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  async function resolve(id: string, action: ModerationAction) {
    if (!confirm(`確定執行「${action}」？`)) return
    setProcessing(id)
    try {
      await fetch('/api/super-admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setItems(prev => prev.filter(i => i.id !== id))
    } finally {
      setProcessing(null)
    }
  }

  const tabs: { key: ModerationTab; label: string }[] = [
    { key: 'pending', label: '待審核' },
    { key: 'reported', label: '檢舉' },
    { key: 'resolved', label: '已處理' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🛡️ 內容審核</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/50 animate-pulse">載入審核佇列...</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-white/30">
          {tab === 'pending' ? '🎉 沒有待審核的內容' : tab === 'reported' ? '沒有待處理的檢舉' : '暫無歷史記錄'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                      {TYPE_LABELS[item.content_type] ?? item.content_type}
                    </span>
                    {item.ai_action && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.ai_action === 'block' ? 'bg-red-500/20 text-red-400' :
                        item.ai_action === 'flag' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        AI: {item.ai_action}
                        {item.ai_confidence ? ` ${Math.round(item.ai_confidence * 100)}%` : ''}
                      </span>
                    )}
                    <span className="text-xs text-white/30">{new Date(item.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                  {item.content_preview && (
                    <p className="text-sm text-white/70 line-clamp-3 bg-slate-800/50 rounded-lg px-3 py-2">
                      {item.content_preview}
                    </p>
                  )}
                  {item.ai_categories && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(item.ai_categories).map(([cat, score]) => (
                        <span key={cat} className="text-xs bg-slate-800 text-white/50 px-2 py-0.5 rounded">
                          {cat}: {typeof score === 'number' ? Math.round(score * 100) : score}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {tab !== 'resolved' && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
                  {ACTION_BTNS.map(btn => (
                    <button
                      key={btn.action}
                      disabled={processing === item.id}
                      onClick={() => resolve(item.id, btn.action)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 ${btn.cls}`}
                    >
                      {processing === item.id ? '…' : btn.label}
                    </button>
                  ))}
                  {tab === 'reported' && (
                    <button
                      disabled={processing === item.id}
                      onClick={() => resolve(item.id, 'dismiss')}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
                    >
                      駁回檢舉
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

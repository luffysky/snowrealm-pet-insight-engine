'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'

type Category = 'all' | 'login' | 'survey' | 'story' | 'comment' | 'zcoin' | 'payment' | 'upload' | 'alert'

interface FeedEntry {
  id: string
  user_id: string | null
  action: string
  category: string
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
  nickname: string | null
  display_name: string | null
}

const CATEGORY_TABS: { key: Category; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '⚡' },
  { key: 'login', label: '登入', icon: '🔑' },
  { key: 'survey', label: '問卷', icon: '📋' },
  { key: 'story', label: '故事', icon: '📖' },
  { key: 'comment', label: '留言', icon: '💬' },
  { key: 'zcoin', label: 'Z幣', icon: '🪙' },
  { key: 'payment', label: '金流', icon: '💳' },
  { key: 'upload', label: '上傳', icon: '📷' },
  { key: 'alert', label: '⚠️ 警報', icon: '🚨' },
]

const ACTION_ICONS: Record<string, string> = {
  'auth.login': '🔑',
  'auth.register': '🆕',
  'survey.complete': '✅',
  'survey.start': '▶️',
  'story.create': '📖',
  'comment.create': '💬',
  'zcoin.earn': '🪙',
  'zcoin.spend': '💸',
  'zcoin.topup': '💰',
  'file.upload': '📷',
  'system.auto_ban': '🚫',
  'payment.complete': '💳',
}

function getIcon(action: string) { return ACTION_ICONS[action] ?? '⚡' }
function isAlert(entry: FeedEntry) { return entry.category === 'alert' || entry.action.includes('auto_ban') || entry.action.includes('block') }

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function LiveFeedPage() {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [category, setCategory] = useState<Category>('all')
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)
  const sseRef = useRef<EventSource | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/live-feed?category=${category}&limit=50`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .finally(() => setLoading(false))
  }, [category])

  useEffect(() => { loadInitial() }, [loadInitial])

  useEffect(() => {
    if (!live) { sseRef.current?.close(); return }

    const es = new EventSource('/api/super-admin/live-feed/stream')
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'ping') return
        if (Array.isArray(data)) {
          setEntries(prev => {
            const newEntries = data.filter(d => !prev.some(p => p.id === d.id))
            if (newEntries.length === 0) return prev
            return [...newEntries.reverse(), ...prev].slice(0, 200)
          })
        }
      } catch { /* ignore parse errors */ }
    }

    return () => es.close()
  }, [live])

  const filtered = category === 'all' ? entries : entries.filter(e => e.category === category || (category === 'alert' && isAlert(e)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">⚡ 即時活動流</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <button
            onClick={() => setLive(l => !l)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all ${live ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
          >
            {live ? '即時更新中' : '已暫停'}
          </button>
          <button onClick={loadInitial} className="text-sm px-3 py-1.5 bg-slate-700 text-white/60 hover:bg-slate-600 rounded-lg">
            重新載入
          </button>
        </div>
      </div>

      {/* 類別篩選 */}
      <div className="flex flex-wrap gap-1">
        {CATEGORY_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === t.key
                ? t.key === 'alert' ? 'bg-red-500/30 text-red-300' : 'bg-white/15 text-white'
                : 'bg-slate-800 text-white/40 hover:text-white/70'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 活動流 */}
      {loading ? (
        <p className="text-white/50 animate-pulse">載入活動記錄...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-white/30">
          暫無活動記錄
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden max-h-[calc(100vh-280px)] overflow-y-auto">
          <div className="divide-y divide-slate-800/50">
            {filtered.map(entry => (
              <div
                key={entry.id}
                className={`flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors ${
                  isAlert(entry) ? 'bg-red-500/5 border-l-2 border-red-500/50' : ''
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{getIcon(entry.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">
                    {entry.nickname || entry.display_name ? (
                      <Link href={`/snowrealm-insight-ctrl/users/${entry.user_id}`} className="text-cyan-400 hover:underline">
                        {entry.nickname || entry.display_name}
                      </Link>
                    ) : entry.user_id ? (
                      <Link href={`/snowrealm-insight-ctrl/users/${entry.user_id}`} className="text-white/50 font-mono text-xs hover:underline">
                        {entry.user_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-white/30">系統</span>
                    )}
                    {' '}
                    <span className="text-white/60">{entry.action}</span>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <span className="text-white/40 text-xs ml-2">
                        {JSON.stringify(entry.details).slice(0, 60)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-white/30 font-mono">{formatTime(entry.created_at)}</p>
                  {entry.ip_address && <p className="text-xs text-white/20 font-mono">{entry.ip_address}</p>}
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      <p className="text-xs text-white/20 text-right">顯示 {filtered.length} 筆（最多 200 筆）</p>
    </div>
  )
}

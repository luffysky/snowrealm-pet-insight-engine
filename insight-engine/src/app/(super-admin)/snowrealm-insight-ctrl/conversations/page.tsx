'use client'

import { useEffect, useState, useCallback } from 'react'

interface Conversation {
  id: string
  user_id: string | null
  intent_type: string | null
  model: string | null
  message_count: number | null
  total_tokens: number | null
  created_at: string
  nickname: string | null
  display_name: string | null
  last_user_message: string | null
  last_assistant_message: string | null
}

interface Message {
  sender: string
  content: string
  created_at: string
  image_url?: string | null
}

export default function ConversationsPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [intent, setIntent] = useState('all')
  const [model, setModel] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/conversations?page=${page}&intent=${intent}&model=${model}`)
      .then(r => r.json())
      .then(d => { setConvs(d.data ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, intent, model])

  useEffect(() => { load() }, [load])

  async function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/super-admin/conversations/${encodeURIComponent(id)}/messages`)
      const d = await res.json() as { data?: Message[]; messages?: Message[] }
      setMessages(d.data ?? d.messages ?? [])
    } finally {
      setLoadingMsgs(false)
    }
  }

  const filtered = search
    ? convs.filter(c => (c.nickname || c.display_name || '').toLowerCase().includes(search.toLowerCase()))
    : convs

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">💬 AI 對話記錄</h1>

      {/* 篩選 */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋使用者..."
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none placeholder:text-slate-600"
        />
        <select value={intent} onChange={e => { setIntent(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none">
          <option value="all">全部意圖</option>
          <option value="chat">閒聊</option>
          <option value="navigation">導覽</option>
          <option value="result">結果解讀</option>
          <option value="zcoin">Z幣</option>
          <option value="bug">Bug 回報</option>
        </select>
        <select value={model} onChange={e => { setModel(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none">
          <option value="all">全部模型</option>
          <option value="claude">Claude</option>
          <option value="gpt-4o-mini">GPT-4o-mini</option>
        </select>
      </div>

      {loading ? (
        <p className="text-white/50 animate-pulse">載入對話記錄...</p>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">使用者</th>
                <th className="text-left px-4 py-2">意圖</th>
                <th className="text-left px-4 py-2">模型</th>
                <th className="text-right px-4 py-2">輪數</th>
                <th className="text-right px-4 py-2">Tokens</th>
                <th className="text-left px-4 py-2">時間</th>
                <th className="text-left px-4 py-2">操作</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-white/30 py-8">無對話記錄</td></tr>
                ) : filtered.map(c => (
                  <>
                    <tr key={c.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${expanded === c.id ? 'bg-slate-800/50' : ''}`}>
                      <td className="px-4 py-2.5 text-white/80">{c.nickname || c.display_name || c.user_id?.slice(0, 8) || '—'}</td>
                      <td className="px-4 py-2.5">
                        {c.intent_type && (
                          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">{c.intent_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-cyan-400 text-xs font-mono">{c.model ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-white/60">{c.message_count ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-white/40 text-xs">{c.total_tokens?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-2.5 text-white/40 text-xs max-w-xs">
                        <div>{new Date(c.created_at).toLocaleString('zh-TW')}</div>
                        {c.last_user_message && (
                          <div className="text-white/30 text-xs mt-0.5 truncate max-w-[200px]" title={c.last_user_message}>
                            👤 {c.last_user_message.slice(0, 60)}{c.last_user_message.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => toggleExpand(c.id)} className="text-xs text-cyan-400 hover:underline">
                          {expanded === c.id ? '收起' : '查看'}
                        </button>
                      </td>
                    </tr>
                    {expanded === c.id && (
                      <tr key={`${c.id}-messages`} className="border-b border-slate-800/50">
                        <td colSpan={7} className="px-4 py-3">
                          {loadingMsgs ? (
                            <p className="text-white/40 text-xs animate-pulse">載入對話...</p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {messages.map((m, i) => (
                                <div key={i} className={`flex gap-2 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] px-3 py-2 rounded-xl ${
                                    m.sender === 'user' ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-700 text-white/70'
                                  }`}>
                                    <span className="text-white/30 mr-1">{m.sender === 'user' ? '👤' : '🤖'}</span>
                                    {m.image_url && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={m.image_url}
                                        alt="使用者上傳圖片"
                                        className="mt-1 mb-1 max-w-[200px] max-h-[160px] rounded-lg object-cover border border-white/10"
                                      />
                                    )}
                                    {m.content}
                                  </div>
                                </div>
                              ))}
                              {messages.length === 0 && <p className="text-white/30 text-center">無訊息記錄</p>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30">上一頁</button>
          <span className="text-sm text-white/40">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30">下一頁</button>
        </div>
      )}
    </div>
  )
}

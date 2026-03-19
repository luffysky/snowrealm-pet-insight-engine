'use client'

import { useEffect, useState } from 'react'

interface TagOption {
  key: string
  value: string
  count: number
}

export default function BroadcastPage() {
  const [text, setText] = useState('')
  const [useTag, setUseTag] = useState(false)
  const [tagKey, setTagKey] = useState('')
  const [tagValue, setTagValue] = useState('')
  const [tags, setTags] = useState<TagOption[]>([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [useSchedule, setUseSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [logs, setLogs] = useState<{ id: string; message: string; tag_filter: { key: string; value: string } | null; sent_count: number; created_at: string; scheduled_at: string | null }[]>([])

  useEffect(() => {
    fetch('/api/admin/tags')
      .then((r) => r.json())
      .then((data: TagOption[]) => setTags(data))
      .catch(() => {})

    fetch('/api/admin/broadcast?logs=1')
      .then((r) => r.json())
      .then((data) => setLogs(data))
      .catch(() => {})
  }, [])

  const uniqueKeys = [...new Set(tags.map((t) => t.key))]
  const valuesForKey = tags.filter((t) => t.key === tagKey)

  const handleSend = async () => {
    if (!text.trim()) return
    const confirmMsg = useSchedule
      ? `確定要排程在 ${scheduledAt} 推播？`
      : useTag ? `確定要推播給 ${tagKey}=${tagValue} 的使用者？` : '確定要群發給所有好友？'
    if (!confirm(confirmMsg)) return

    setSending(true)
    setResult('')
    try {
      const body: Record<string, unknown> = { text: text.trim() }
      if (useTag && tagKey && tagValue) {
        body.tagFilter = { key: tagKey, value: tagValue }
      }
      if (useSchedule && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString()
      }
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data.scheduled ? `✅ 已排程：${new Date(data.scheduledAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}` : data.broadcast ? '✅ 已群發給所有好友' : `✅ 已推播給 ${data.sent} 人`)
        setText('')
        setScheduledAt('')
        setUseSchedule(false)
        // reload logs
        fetch('/api/admin/broadcast?logs=1').then((r) => r.json()).then(setLogs).catch(() => {})
      } else {
        setResult(`❌ ${data.error}`)
      }
    } catch {
      setResult('❌ 發送失敗')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white/90">LINE 推播</h1>

      {/* 發送表單 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">推播訊息</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="輸入要推播的訊息..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm resize-none"
          />
        </div>

        {/* 分眾篩選 */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useTag}
              onChange={(e) => setUseTag(e.target.checked)}
              className="accent-cyan-500"
            />
            依標籤分眾推播
          </label>
        </div>

        {useTag && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">標籤類型</label>
              <select
                value={tagKey}
                onChange={(e) => { setTagKey(e.target.value); setTagValue('') }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">選擇標籤</option>
                {uniqueKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">標籤值</label>
              <select
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">選擇值</option>
                {valuesForKey.map((t) => (
                  <option key={t.value} value={t.value}>{t.value} ({t.count})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 排程推播 */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useSchedule}
              onChange={(e) => setUseSchedule(e.target.checked)}
              className="accent-cyan-500"
            />
            排程推播
          </label>
        </div>

        {useSchedule && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">排程時間</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim() || (useTag && (!tagKey || !tagValue)) || (useSchedule && !scheduledAt)}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            {sending ? '發送中...' : useSchedule ? '排程推播' : useTag ? '分眾推播' : '群發所有好友'}
          </button>
          {result && <p className="text-sm">{result}</p>}
        </div>
      </div>

      {/* 推播紀錄 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white/80">推播紀錄</h2>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">尚無推播紀錄</p>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">時間</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">訊息</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">對象</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">排程</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">人數</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/30">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{log.message}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.tag_filter ? `${log.tag_filter.key}=${log.tag_filter.value}` : '全部好友'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {log.scheduled_at
                          ? (log.sent_count === 0
                            ? `⏰ ${new Date(log.scheduled_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`
                            : `✅ ${new Date(log.scheduled_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{log.sent_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

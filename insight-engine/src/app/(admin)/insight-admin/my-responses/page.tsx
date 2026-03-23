'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface MyResponse {
  id: string
  surveyTitle: string
  surveySlug: string
  status: string
  submittedAt: string | null
  createdAt: string
  answerCount: number
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) } catch { return iso }
}

export default function MyResponsesPage() {
  const [responses, setResponses] = useState<MyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pathname = usePathname()
  const segments = pathname.split('/')
  const slug = segments[2] ?? ''
  const adminPrefix = `/insight-admin/${slug}`

  useEffect(() => {
    fetch('/api/admin/my-responses')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setResponses(data.responses ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入填答記錄...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📋 我的填答記錄</h1>
      <p className="text-sm text-white/40">
        這裡顯示你以登入帳號身份回答過的問卷。匿名填答不會出現在此列表。
      </p>

      {responses.length === 0 ? (
        <div className="bg-t-card-bg border border-t-card-border rounded-xl p-8 text-center">
          <p className="text-white/40 text-sm">尚無填答記錄</p>
          <p className="text-xs text-white/20 mt-1">以登入帳號身份填答問卷後，紀錄將出現在這裡。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map(r => (
            <div key={r.id} className="bg-t-card-bg border border-t-card-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-white font-medium">{r.surveyTitle}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/40">
                  <span className={`px-2 py-0.5 rounded-full ${
                    r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {r.status === 'completed' ? '已完成' : '進行中'}
                  </span>
                  <span>{r.answerCount} 題已答</span>
                  <span>{r.submittedAt ? formatTime(r.submittedAt) : formatTime(r.createdAt)}</span>
                </div>
              </div>
              <Link
                href={`${adminPrefix}/responses`}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors"
              >
                查看詳情
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

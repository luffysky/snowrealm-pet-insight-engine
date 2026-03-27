'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, ExternalLink, Flag } from 'lucide-react'

interface Report {
  id: string
  reporter_name: string
  target_type: string
  target_id: string
  target_content: string | null
  target_author_name: string | null
  reason: string
  reasonLabel: string
  description: string | null
  status: string
  created_at: string
}

type StatusTab = 'pending' | 'resolved' | 'dismissed'

const REASON_COLORS: Record<string, string> = {
  spam: 'text-orange-400 bg-orange-500/10',
  harassment: 'text-red-400 bg-red-500/10',
  inappropriate: 'text-red-400 bg-red-500/10',
  violence: 'text-red-400 bg-red-500/10',
  fraud: 'text-yellow-400 bg-yellow-500/10',
  privacy: 'text-purple-400 bg-purple-500/10',
  copyright: 'text-blue-400 bg-blue-500/10',
  other: 'text-white/40 bg-white/5',
}

export default function SocialReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<StatusTab>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/social/reports?status=${statusTab}&limit=50`)
      const data = await res.json() as { reports: Report[] }
      setReports(data.reports ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusTab])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'resolve' | 'dismiss') {
    setProcessing(id)
    try {
      await fetch('/api/admin/social/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setReports(prev => prev.filter(r => r.id !== id))
    } finally {
      setProcessing(null)
    }
  }

  const pendingCount = reports.length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" /> 檢舉管理
          </h1>
          <p className="text-sm text-white/40 mt-0.5">審核用戶舉報的貼文、留言或帳號</p>
        </div>
        {statusTab === 'pending' && pendingCount > 0 && (
          <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-500/30">
            {pendingCount} 待處理
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['pending', 'resolved', 'dismissed'] as StatusTab[]).map(tab => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusTab === tab
                ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300'
                : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            {tab === 'pending' ? '⏳ 待處理' : tab === 'resolved' ? '✅ 已處理' : '🗑️ 已忽略'}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p className="text-3xl mb-3">✅</p>
            <p>{statusTab === 'pending' ? '目前沒有待處理的舉報' : '沒有紀錄'}</p>
          </div>
        ) : reports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            showActions={statusTab === 'pending'}
            processing={processing === report.id}
            onResolve={() => handleAction(report.id, 'resolve')}
            onDismiss={() => handleAction(report.id, 'dismiss')}
          />
        ))}
      </div>
    </div>
  )
}

interface ReportCardProps {
  report: Report
  showActions: boolean
  processing: boolean
  onResolve: () => void
  onDismiss: () => void
}

function ReportCard({ report, showActions, processing, onResolve, onDismiss }: ReportCardProps) {
  const timeStr = new Date(report.created_at).toLocaleDateString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const reasonColor = REASON_COLORS[report.reason] ?? 'text-white/40 bg-white/5'
  const targetLink = report.target_type === 'post' ? `/articles/${report.target_id}` : null

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reasonColor}`}>
            {report.reasonLabel}
          </span>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full capitalize">
            {report.target_type === 'post' ? '貼文' : report.target_type === 'comment' ? '留言' : report.target_type === 'user' ? '用戶' : '訊息'}
          </span>
          <span className="text-xs text-white/25">{timeStr}</span>
        </div>
        {targetLink && (
          <a href={targetLink} target="_blank" rel="noopener noreferrer"
            className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="text-xs text-white/40">
          <span className="text-white/60">{report.reporter_name}</span> 舉報了{' '}
          {report.target_author_name && <span className="text-white/60">{report.target_author_name}</span>} 的內容
        </div>
        {report.target_content && (
          <div className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 line-clamp-2 border-l-2 border-white/10">
            {report.target_content}
          </div>
        )}
        {report.description && (
          <p className="text-xs text-white/40 italic">「{report.description}」</p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onResolve}
            disabled={processing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-400/25 text-red-400 hover:bg-red-500/25 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" /> 處理（隱藏內容）
          </button>
          <button
            onClick={onDismiss}
            disabled={processing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> 忽略
          </button>
        </div>
      )}
    </div>
  )
}

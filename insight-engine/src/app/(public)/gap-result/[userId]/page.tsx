'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UnlockModal } from '@/components/public/UnlockModal'

interface GapSnapshot {
  traitKey: string
  selfScore: number
  othersAvgScore: number
  gapScore: number
  weightedGapScore: number
  responseCount: number
  gapLevel: 'aligned' | 'slight' | 'notable' | 'strong'
  confidenceLevel: number
}

interface GapReport {
  userId: string
  surveyId: string
  totalGapScore: number
  gapLevel: 'aligned' | 'slight' | 'notable' | 'strong'
  snapshots: GapSnapshot[]
  aiStory: string
  styleKey: string
  isPartial: boolean
  generatedAt: string
}

interface SnapshotResponse {
  snapshots: GapSnapshot[]
  overallGapLevel: string
  hasData: boolean
}

const GAP_LEVEL_LABEL = {
  aligned: { label: '高度一致', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  slight:  { label: '輕微落差', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  notable: { label: '明顯落差', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  strong:  { label: '強烈落差', color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
} as const

function RadarBar({ label, self, others }: { label: string; self: number; others: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span className="space-x-3">
          <span className="text-cyan-400">自評 {self}</span>
          <span className="text-amber-400">他評 {others}</span>
        </span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-cyan-500/40 rounded-full transition-all"
          style={{ width: `${self}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 h-full w-0.5 bg-amber-400"
          style={{ left: `${others}%` }}
        />
      </div>
    </div>
  )
}

export default function GapResultPage() {
  const params = useParams<{ userId: string }>()
  const searchParams = useSearchParams()
  const surveySlug = searchParams.get('survey') ?? ''

  const [snapshots, setSnapshots] = useState<GapSnapshot[]>([])
  const [report, setReport] = useState<GapReport | null>(null)
  const [overallLevel, setOverallLevel] = useState<string>('aligned')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [unlockModal, setUnlockModal] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (!params.userId || !surveySlug) {
      setLoading(false)
      return
    }

    fetch(`/api/cognitive-gap/snapshot?userId=${params.userId}&surveySlug=${surveySlug}`)
      .then(r => (r.ok ? (r.json() as Promise<SnapshotResponse>) : null))
      .then(async data => {
        if (!data?.hasData) return null
        setSnapshots(data.snapshots)
        setOverallLevel(data.overallGapLevel)
        return fetch(
          `/api/cognitive-gap/report?userId=${params.userId}&surveySlug=${surveySlug}&style=A`
        )
      })
      .then(async res => {
        if (res?.ok) {
          const r = (await res.json()) as GapReport
          setReport(r)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.userId, surveySlug])

  async function generateReport(styleKey: 'A' | 'B' | 'C' | 'D' | 'E' = 'A', isPartial = true) {
    setGenerating(true)
    try {
      const res = await fetch('/api/cognitive-gap/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: params.userId, surveySlug, styleKey, isPartial }),
      })
      if (res.ok) {
        const r = (await res.json()) as GapReport
        setReport(r)
        if (!isPartial) setUnlocked(true)
      }
    } finally {
      setGenerating(false)
    }
  }

  const levelInfo =
    GAP_LEVEL_LABEL[overallLevel as keyof typeof GAP_LEVEL_LABEL] ?? GAP_LEVEL_LABEL.aligned
  const biggestGap = [...snapshots].sort(
    (a, b) => Math.abs(b.gapScore) - Math.abs(a.gapScore)
  )[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/40 animate-pulse text-sm">分析中...</p>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🔮</p>
        <h1 className="text-xl font-bold text-white">還沒有數據</h1>
        <p className="text-white/50 text-sm">
          完成問卷並邀請朋友評分後，才會顯示認知落差分析
        </p>
        {surveySlug && (
          <Link
            href={`/${surveySlug}`}
            className="mt-2 px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
          >
            開始填寫問卷
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← 首頁
          </Link>
          <span className="text-xs text-white/30">認知落差分析</span>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🔮</div>
          <h1 className="text-2xl font-bold">你以為 vs 別人眼中</h1>
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${levelInfo.bg} ${levelInfo.color}`}
          >
            {levelInfo.label}
          </div>
        </div>

        {/* 免費摘要卡片 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            初步洞察
          </h2>

          {/* 最一致特質 */}
          {snapshots.filter(s => s.gapLevel === 'aligned').length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400/80">✅ 你最了解自己的地方</p>
              <p className="text-sm text-white/80">
                「{snapshots.filter(s => s.gapLevel === 'aligned')[0].traitKey}」
                — 你的自評與他人看法高度一致
              </p>
            </div>
          )}

          {/* 最大落差提示 */}
          {biggestGap && Math.abs(biggestGap.gapScore) > 10 && (
            <div className="space-y-1">
              <p className="text-xs text-amber-400/80">⚠️ 最大認知落差</p>
              <p className="text-sm text-white/80">
                「{biggestGap.traitKey}」— 你
                {biggestGap.gapScore > 0 ? '可能高估了自己' : '可能低估了自己'}
                （落差 {Math.abs(biggestGap.gapScore).toFixed(0)} 分）
              </p>
            </div>
          )}

          {/* 雷達條（只顯示前 2 條） */}
          <div className="space-y-3 pt-2">
            {snapshots.slice(0, 2).map(s => (
              <RadarBar
                key={s.traitKey}
                label={s.traitKey}
                self={s.selfScore}
                others={s.othersAvgScore}
              />
            ))}
          </div>

          <p className="text-xs text-white/30 text-center">
            來自 {Math.max(...snapshots.map(s => s.responseCount))} 位朋友的評分
          </p>
        </div>

        {/* AI 故事（免費版 A 風格） */}
        {!report && !generating && (
          <button
            onClick={() => generateReport('A', true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm transition-all"
          >
            ✨ 生成我的認知落差故事
          </button>
        )}
        {generating && (
          <div className="text-center py-4 text-white/40 text-sm animate-pulse">
            AI 分析中...
          </div>
        )}
        {report && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">
              ✨ AI 認知落差故事
            </p>
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
              {report.isPartial && !unlocked
                ? report.aiStory.slice(0, 120) + '...'
                : report.aiStory}
            </p>
            {report.isPartial && !unlocked && (
              <div className="pt-1">
                <div className="h-8 bg-gradient-to-b from-transparent to-slate-900 -mt-10 mb-2 relative z-10" />
                <p className="text-xs text-white/30 text-center">— 以下內容已鎖定 —</p>
              </div>
            )}
          </div>
        )}

        {/* 鎖定內容 */}
        {!unlocked && (
          <div className="border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-white/40 text-center uppercase tracking-wider">
              解鎖完整分析
            </p>
            <div className="space-y-2">
              {(
                [
                  ['🔒', '完整認知落差雷達圖（所有特質）'],
                  ['🔒', '5 種風格的 AI 深度故事'],
                  ['🔒', '關係改善具體建議'],
                  ['🔒', '你的人際盲點完整解析'],
                ] as const
              ).map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 text-sm text-white/30">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setUnlockModal(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-sm transition-all"
            >
              解鎖完整分析
            </button>
          </div>
        )}

        {/* 邀請更多朋友 */}
        <div className="text-center space-y-2">
          <p className="text-xs text-white/30">
            已有 {Math.max(...snapshots.map(s => s.responseCount), 0)} 位朋友評分
          </p>
          {surveySlug && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/rate-friend/${params.userId}/${surveySlug}`
                navigator.clipboard.writeText(url).catch(() => {})
                alert('已複製邀請連結！')
              }}
              className="text-sm text-cyan-400 hover:text-cyan-300 underline transition-colors"
            >
              📤 邀請更多朋友來評分（分析更精準）
            </button>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {unlockModal && (
        <UnlockModal
          onClose={() => setUnlockModal(false)}
          onUnlockZcoin={async () => {
            setUnlockModal(false)
            await generateReport('B', false)
          }}
          onUnlockAd={() => {
            setUnlockModal(false)
            generateReport('A', false)
          }}
        />
      )}
    </div>
  )
}

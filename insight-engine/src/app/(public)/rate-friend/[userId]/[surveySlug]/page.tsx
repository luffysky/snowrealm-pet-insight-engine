'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Survey {
  id: string
  title: string
  questions: Array<{
    key: string
    content: string
    type: string
    options: Array<{ label: string; value: string }>
  }>
  quizConfig?: {
    traitKeys?: string[]
    ratingScale?: { min: number; max: number; labels: string[] }
  }
}

interface TraitRating {
  traitKey: string
  label: string
  score: number
}

const DEFAULT_TRAITS = [
  { key: 'warmth',      label: '溫暖親切程度' },
  { key: 'confidence',  label: '自信程度' },
  { key: 'reliability', label: '可靠穩定程度' },
  { key: 'creativity',  label: '創意思維程度' },
  { key: 'empathy',     label: '同理心程度' },
]

function TraitSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-cyan-400 font-semibold tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full bg-white/10 accent-cyan-500 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-white/20">
        <span>完全不像</span>
        <span>非常像</span>
      </div>
    </div>
  )
}

export default function RateFriendPage() {
  const params = useParams<{ userId: string; surveySlug: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [traits, setTraits] = useState<TraitRating[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/surveys/${params.surveySlug}`)
      .then(r => (r.ok ? (r.json() as Promise<Survey>) : null))
      .then(data => {
        setSurvey(data)
        const traitList = data?.quizConfig?.traitKeys
          ? data.quizConfig.traitKeys.map(k => ({ key: k, label: k }))
          : DEFAULT_TRAITS
        setTraits(traitList.map(t => ({ traitKey: t.key, label: t.label, score: 50 })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.surveySlug])

  async function handleSubmit() {
    if (submitting || traits.length === 0) return
    setSubmitting(true)
    try {
      const answers = Object.fromEntries(traits.map(t => [t.traitKey, t.score]))
      const res = await fetch('/api/cognitive-gap/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveySlug: params.surveySlug,
          responseId: params.userId,
          answers,
          targetUserId: params.userId,
          isExternal: true,
        }),
      })
      if (res.ok) setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/40 animate-pulse text-sm">載入中...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">💛</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">感謝你的評分！</h1>
          <p className="text-white/50 text-sm">你的回答已匿名傳送，幫助你的朋友更了解自己</p>
        </div>
        <Link
          href="/explore"
          className="px-6 py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
        >
          探索更多問卷
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← 首頁
          </Link>
          <span className="text-xs text-white/30">朋友邀請你評分</span>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔮</div>
          <h1 className="text-xl font-bold">你覺得你的朋友怎麼樣？</h1>
          <p className="text-white/50 text-sm">
            根據你對他/她的了解，誠實地評分吧！
            <br />你的回答完全匿名，他/她不會知道是你。
          </p>
        </div>

        {survey && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-white/30">關聯問卷</p>
            <p className="text-sm text-white/70 font-medium">{survey.title}</p>
          </div>
        )}

        <div className="space-y-6">
          {traits.map((t, i) => (
            <TraitSlider
              key={t.traitKey}
              label={t.label}
              value={t.score}
              onChange={v =>
                setTraits(prev =>
                  prev.map((p, pi) => (pi === i ? { ...p, score: v } : p))
                )
              }
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {submitting ? '送出中...' : '送出評分 →'}
        </button>

        <p className="text-center text-xs text-white/20">你的評分完全匿名 · 不會透露給任何人</p>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReferralInfo {
  valid: boolean
  referrerName?: string
  code?: string
}

export default function InvitePage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.code) return
    fetch(`/api/referral?code=${encodeURIComponent(params.code)}`)
      .then(r => r.ok ? r.json() as Promise<ReferralInfo> : { valid: false })
      .then(data => setInfo(data))
      .catch(() => setInfo({ valid: false }))
      .finally(() => setLoading(false))
  }, [params.code])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/40 animate-pulse text-sm">驗證邀請連結中...</p>
      </div>
    )
  }

  if (!info?.valid) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🔗</p>
        <h1 className="text-xl font-bold text-white">邀請連結無效</h1>
        <p className="text-white/50 text-sm">此邀請碼不存在或已失效</p>
        <Link href="/register" className="mt-2 px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
          直接免費註冊
        </Link>
      </div>
    )
  }

  const registerUrl = `/register?ref=${encodeURIComponent(params.code)}`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">

        {/* Logo */}
        <div className="space-y-1">
          <div className="text-4xl">❄️</div>
          <p className="text-sm text-slate-400 font-medium">SnowRealm Insight Engine</p>
        </div>

        {/* Invite card */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">你的朋友</p>
            <p className="text-2xl font-bold text-white">{info.referrerName}</p>
            <p className="text-slate-400 text-sm">邀請你加入 SnowRealm Insight Engine</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3 text-left">
            {[
              ['🎁', '30 天全功能免費試用（比一般長 7 天）'],
              ['🤖', 'AI 智慧問卷 + 洞察報告'],
              ['📊', '漏斗分析 / 標籤 CRM / LINE 推播'],
              ['🪙', '額外獲得 50 Z 幣'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push(registerUrl)}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
          >
            接受邀請，免費開始 →
          </button>

          <p className="text-xs text-white/30">
            邀請碼：{params.code.toUpperCase()}
          </p>
        </div>

        {/* Trust signals */}
        <div className="flex justify-center gap-6 text-xs text-white/30">
          <span>不需信用卡</span>
          <span>·</span>
          <span>3 分鐘建立第一份問卷</span>
          <span>·</span>
          <span>免費方案永久有效</span>
        </div>

        <p className="text-xs text-white/20">
          已有帳號？{' '}
          <Link href={`/login?redirect=${encodeURIComponent(`/invite/${params.code}`)}`} className="text-white/40 hover:text-white/60 transition-colors underline">
            直接登入
          </Link>
        </p>
      </div>
    </div>
  )
}

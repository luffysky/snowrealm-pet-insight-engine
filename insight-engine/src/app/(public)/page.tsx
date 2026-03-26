import Link from 'next/link'
import { HomeNav } from '@/components/public/HomeNav'

const FEATURES = [
  { icon: '📝', title: '智慧問卷建立', desc: '拖拉排序、分流邏輯、AI 出題，3 分鐘完成一份專業問卷' },
  { icon: '🎨', title: '9 種主題風格', desc: '從極簡到科幻，一鍵切換視覺風格，讓問卷符合品牌調性' },
  { icon: '📊', title: '即時數據分析', desc: '漏斗轉換、交叉分析、標籤統計，回覆即時視覺化' },
  { icon: '🏷️', title: 'CRM 自動標籤', desc: '根據回答自動貼標，輕鬆建立顧客輪廓' },
  { icon: '💬', title: 'LINE 深度整合', desc: '推播問卷、綁定用戶、Rich Menu、自動通知一站完成' },
  { icon: '🔗', title: 'UTM 追蹤 & Webhook', desc: '精準追蹤行銷來源，串接外部系統自動化流程' },
  { icon: '🧪', title: 'A/B 比較', desc: '不同版本問卷效果對比，數據驅動優化' },
  { icon: '🏢', title: '多租戶架構', desc: '每個組織獨立管理，資料完全隔離，安全可靠' },
]

const STEPS = [
  { step: '1', title: '免費註冊', desc: '30 秒建立你的組織帳號' },
  { step: '2', title: '建立問卷', desc: '用 AI 或手動建立你的第一份問卷' },
  { step: '3', title: '分享收集', desc: '取得量身訂做的問卷連結，開始收集回覆' },
  { step: '4', title: '分析洞察', desc: '即時查看數據、標籤、趨勢分析' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
        <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white/90">🐾 SnowRealm Insight Engine</Link>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">🔍 探索問卷</Link>
            <HomeNav />
          </div>
        </nav>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              智慧問卷系統
            </span>
            <br />
            <span className="text-white/90 text-3xl sm:text-4xl">讓數據為你說話</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            從問卷建立、數據分析到 LINE CRM 整合，一站式解決方案。
            <br className="hidden sm:block" />
            支援多組織管理、AI 出題、自動標籤，讓你的每份問卷都有洞察力。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-base hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
            >
              免費建立我的問卷 →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all text-base"
            >
              了解更多
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white/90 mb-3">功能亮點</h2>
          <p className="text-slate-400">一個系統，涵蓋問卷全生命週期</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-base font-semibold text-white/90 mt-3 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900/30 border-y border-slate-800/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white/90 mb-3">如何開始</h2>
            <p className="text-slate-400">四步驟，從零到洞察</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-cyan-400">{s.step}</span>
                </div>
                <h3 className="font-semibold text-white/90 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white/90 mb-4">準備好了嗎？</h2>
        <p className="text-slate-400 mb-8">現在免費註冊，3 分鐘建立你的第一份問卷</p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          立即免費開始 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© 2026 SnowRealm Insight Engine</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/explore" className="hover:text-white transition-colors">探索問卷</Link>
            <Link href="/wallet" className="hover:text-white transition-colors">Z幣錢包</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">隱私權政策</Link>
            <Link href="/terms" className="hover:text-white transition-colors">使用者條款</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie 政策</Link>
            <Link href="/login" className="hover:text-white transition-colors">登入</Link>
            <Link href="/register" className="hover:text-white transition-colors">註冊</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

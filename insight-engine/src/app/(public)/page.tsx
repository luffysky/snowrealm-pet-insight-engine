import Link from 'next/link'
import { HomeNav } from '@/components/public/HomeNav'

// ===== 靜態資料 =====

const VIRAL_TEMPLATES = [
  { icon: '🐾', title: '毛孩飼主心聲調查', fills: '2,341', tag: '寵物' },
  { icon: '🍽️', title: '顧客滿意度問卷', fills: '1,892', tag: '餐飲' },
  { icon: '🚀', title: 'PMF 產品適配度', fills: '1,207', tag: 'SaaS' },
  { icon: '📚', title: '課程回饋問卷', fills: '987', tag: '教育' },
  { icon: '⭐', title: 'NPS 淨推薦分數', fills: '3,054', tag: '通用' },
  { icon: '👥', title: '員工滿意度調查', fills: '642', tag: '人資' },
]

const COGNITIVE_GAPS = [
  { label: '你以為', value: 78, color: 'text-cyan-400' },
  { label: '他人眼中', value: 52, color: 'text-purple-400' },
  { label: '落差', value: 26, color: 'text-rose-400', isDiff: true },
]

const B_END_FLOW = [
  { icon: '📝', step: '建立問卷', desc: 'AI 三分鐘生成，9 種主題' },
  { icon: '📊', step: 'AI 分析', desc: '洞察報告 + 故事模式' },
  { icon: '🏷️', step: 'CRM 標籤', desc: '自動貼標，建立顧客輪廓' },
  { icon: '💬', step: 'LINE 推播', desc: '分眾推播，閉環觸達' },
]

const STORY_CARDS = [
  {
    quote: '500 位飼主中，72% 最後悔「照片記錄太少」',
    tag: '毛孩足跡問卷',
    emoji: '🐾',
  },
  {
    quote: '你選了微糖，跟 38% 的人一樣。但你選抹茶——只有 7%！',
    tag: '飲料偏好調查',
    emoji: '🍵',
  },
  {
    quote: '你的學習目標是創業，這讓你站在前 15%。',
    tag: '課程學習問卷',
    emoji: '🎓',
  },
]

const PRICING = [
  {
    name: 'Personal',
    price: '免費',
    period: '',
    highlight: false,
    features: [
      '最多 3 份問卷',
      '每月 300 筆回覆',
      'AI 出題（每月 1 次）',
      '基本數據分析',
      'LINE 整合（基礎）',
    ],
    cta: '免費開始',
    href: '/register',
  },
  {
    name: 'Business',
    price: 'NT$990',
    period: '/ 月',
    highlight: true,
    features: [
      '無限問卷',
      '無限回覆',
      'AI 出題 + 洞察報告',
      '故事模式 + 故事牆',
      'LINE CRM 全功能',
      'A/B 比較 + 漏斗分析',
      '自動化觸發引擎',
      '優先客服支援',
    ],
    cta: '30 天免費試用',
    href: '/register?plan=business',
  },
]

// ===== 元件 =====

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── 導覽列 ── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-white/90 tracking-tight">
            ✦ SnowRealm Insight Engine
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
              定價
            </Link>
            <HomeNav />
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/12 via-transparent to-purple-600/12 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-purple-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Native 智慧問卷引擎 · 多租戶 SaaS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            <span className="text-white/90">不是問卷而已，</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              是人性洞察引擎
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            從問卷建立、AI 分析到 LINE CRM 自動化，一站式覆蓋顧客洞察全流程。
            <br className="hidden sm:block" />
            填答者拿到的不是收據，而是一張屬於自己的故事卡片。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="px-8 py-3.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 backdrop-blur-sm text-cyan-300 font-medium text-base hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              先玩一份熱門問卷 →
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-base hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
            >
              免費建立問卷
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            30 天全功能免費試用 · 不需信用卡 · 隨時取消
          </p>
        </div>
      </section>

      {/* ── 熱門模板輪播 ── */}
      <section className="py-16 overflow-hidden border-y border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white/90 mb-2">熱門問卷模板</h2>
            <p className="text-sm text-slate-500">一鍵複製，立即發佈</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {VIRAL_TEMPLATES.map((t) => (
              <Link
                key={t.title}
                href="/register"
                className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/8 hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <span className="text-3xl mb-3">{t.icon}</span>
                <span className="text-xs font-medium text-white/80 mb-1 leading-snug">{t.title}</span>
                <span className="text-xs text-slate-500">{t.fills} 人填過</span>
                <span className="mt-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                  {t.tag}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/register" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              查看全部模板 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 認知落差預覽 ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
                認知落差洞察
              </div>
              <h2 className="text-3xl font-bold text-white/90 mb-4 leading-tight">
                數字說的，<br />
                比你想的更殘忍
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                你以為顧客滿意度是 78 分，但他們眼中的你只有 52 分。
                這 26 分的落差，就是你還沒挖到的商業機會。
                Insight Engine 讓你直視真相。
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                開始收集你的真實數據 →
              </Link>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs text-slate-500 mb-6 text-center">顧客滿意度感知分析</p>
              <div className="space-y-5">
                {COGNITIVE_GAPS.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 w-20 shrink-0">{item.label}</span>
                    <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      {!item.isDiff && (
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.label === '你以為' ? 'from-cyan-500 to-cyan-400' : 'from-purple-500 to-purple-400'}`}
                          style={{ width: `${item.value}%` }}
                        />
                      )}
                      {item.isDiff && (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400"
                          style={{ width: `${item.value}%` }}
                        />
                      )}
                    </div>
                    <span className={`text-lg font-bold w-10 text-right ${item.color}`}>
                      {item.isDiff ? `▲${item.value}` : item.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 text-center mt-6">
                * 示意數據，實際洞察依問卷回覆生成
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── B端價值：問卷 → AI → CRM → LINE 流程 ── */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              企業端完整解決方案
            </div>
            <h2 className="text-3xl font-bold text-white/90 mb-3">
              從第一個問題，到最後一次推播
            </h2>
            <p className="text-slate-400">全流程自動化，讓洞察真正轉化為行動</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {B_END_FLOW.map((item, i) => (
              <div key={item.step} className="relative">
                {i < B_END_FLOW.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-4 h-px bg-slate-700 z-10" />
                )}
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/12 rounded-2xl p-6 hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all h-full shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 flex items-center justify-center mb-4 text-xl">
                    {item.icon}
                  </div>
                  <div className="text-xs text-cyan-400 font-medium mb-1">STEP {i + 1}</div>
                  <h3 className="text-sm font-semibold text-white/90 mb-1">{item.step}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story Card 展示 ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium mb-6">
              Story × Data 獨家功能
            </div>
            <h2 className="text-3xl font-bold text-white/90 mb-3">
              填答者不只給你數據，<br />
              他們帶走一張故事卡片
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              AI 自動生成個人化故事卡片，填答者主動分享到 LINE 和 IG，
              你的問卷因此病毒式擴散。
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {STORY_CARDS.map((card) => (
              <div
                key={card.tag}
                className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/8 border-t-white/14 rounded-3xl p-6 hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <div className="text-4xl mb-4">{card.emoji}</div>
                <p className="text-sm text-white/80 leading-relaxed mb-4 font-medium">
                  &ldquo;{card.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-xs text-slate-500">{card.tag}</span>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-cyan-400">分享 →</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-700 text-slate-300 text-sm hover:border-cyan-500/40 hover:text-cyan-300 transition-all"
            >
              查看真實故事牆範例 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 定價 ── */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/40" id="pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white/90 mb-3">簡單透明的定價</h2>
            <p className="text-slate-400">從免費開始，業務成長再升級</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 border transition-all shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border-cyan-500/40 border-t-cyan-400/30'
                    : 'bg-white/[0.04] backdrop-blur-xl border-white/8 border-t-white/14'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-medium">
                    最受歡迎
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-white/80'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-cyan-400' : 'text-slate-500'}`}>
                        ✓
                      </span>
                      <span className={plan.highlight ? 'text-white/80' : 'text-slate-400'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3 rounded-2xl font-medium text-sm transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20'
                      : 'border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            需要更大規模或客製化方案？
            <Link href="/register" className="text-slate-500 hover:text-slate-400 underline ml-1">
              聯絡我們
            </Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-bold text-white/90 mb-4 leading-tight">
            你的下一份問卷，<br />
            值得更多洞察
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            加入超過 300 個組織，用 Insight Engine 收集真實的人性數據。
            <br />
            現在開始，免費試用 30 天，全功能無限制。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/25"
            >
              免費開始 30 天試用 →
            </Link>
            <Link
              href="/explore"
              className="px-10 py-4 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-slate-300 text-base hover:border-white/20 hover:bg-white/[0.07] hover:text-white transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              先逛逛熱門問卷
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Community rules banner */}
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-500/5 to-purple-500/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <span>⚖️</span>
              <span>本平台禁止詐騙、騷擾、仇恨言論及任何違法行為。</span>
            </div>
            <Link href="/rules" className="shrink-0 text-amber-400 hover:text-amber-300 font-medium transition-colors">
              閱讀社群規範 →
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">✦ SnowRealm Insight Engine</span>
              <span>© 2026</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/explore" className="hover:text-white transition-colors">探索問卷</Link>
              <Link href="/wallet" className="hover:text-white transition-colors">Z幣錢包</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">定價</Link>
              <Link href="/rules" className="hover:text-amber-400 transition-colors">社群規範</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">隱私政策</Link>
              <Link href="/terms" className="hover:text-white transition-colors">使用條款</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie</Link>
              <Link href="/login" className="hover:text-white transition-colors">登入</Link>
              <Link
                href="/register"
                className="px-3 py-1 rounded-full border border-slate-700 hover:border-slate-600 hover:text-white transition-colors"
              >
                免費註冊
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

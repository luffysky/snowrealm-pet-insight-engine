import Link from 'next/link'
import { HomeNav } from '@/components/public/HomeNav'

const C_PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    unit: '永久免費',
    badge: null,
    highlight: false,
    features: [
      '基礎測驗結果',
      '廣告解鎖完整分析',
      '故事卡片分享',
      '每日 Z幣任務',
      '最多 3 份問卷',
    ],
    cta: '免費開始',
    href: '/register',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 149,
    unit: '/月',
    badge: '最受歡迎',
    highlight: true,
    features: [
      '✅ 所有 Free 功能',
      '無廣告完整認知落差分析',
      '基礎 AI 故事報告（A+B 風格）',
      '無限問卷填答',
      '50 Z幣/月贈送',
    ],
    cta: '升級 Pro',
    href: '/register?plan=pro',
  },
  {
    key: 'plus',
    name: 'Plus',
    price: 399,
    unit: '/月',
    badge: null,
    highlight: false,
    features: [
      '✅ 所有 Pro 功能',
      '關係改善建議（AI 顧問）',
      '成長追蹤（跨時間比較）',
      '5 種 AI 故事風格完整版',
      '150 Z幣/月贈送',
    ],
    cta: '升級 Plus',
    href: '/register?plan=plus',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 799,
    unit: '/月',
    badge: null,
    highlight: false,
    features: [
      '✅ 所有 Plus 功能',
      'AI 模擬對話（練習場景）',
      '深度人格分析報告',
      '優先客服支援',
      '300 Z幣/月贈送',
    ],
    cta: '升級 Premium',
    href: '/register?plan=premium',
  },
]

const B_PLANS = [
  {
    name: 'Starter',
    price: 990,
    features: ['問卷數量上限', '基礎 AI 出題', '標準統計分析', '1 位管理員'],
  },
  {
    name: 'Growth',
    price: 3990,
    badge: '推薦',
    features: ['無限問卷', '完整 AI 洞察', '分群分析', 'LINE 推播', '5 位管理員'],
  },
  {
    name: 'Pro',
    price: 9990,
    features: ['多人協作', '高級 CRM', 'A/B 測試', 'Webhook', 'API 存取'],
  },
  {
    name: 'Enterprise',
    price: 0,
    features: ['白標品牌', '自訂 API', '專屬客服', 'SLA 保障', '客製整合'],
  },
]

const FAQ = [
  {
    q: '免費版能用多久？',
    a: '免費版永久有效，不需要信用卡，基礎功能不受限制。',
  },
  {
    q: 'Z幣是什麼？',
    a: 'Z幣是平台內部貨幣，可用於解鎖認知落差分析、AI 故事報告等進階功能。免費用戶可透過完成任務、觀看廣告等方式賺取。',
  },
  {
    q: '可以隨時取消訂閱嗎？',
    a: '是的，隨時可取消，不收違約金。取消後仍可使用到當期結束。',
  },
  {
    q: 'B 端和 C 端的差別？',
    a: 'B 端方案適合企業/組織使用，包含多租戶管理、LINE CRM、問卷建立等工具。C 端方案適合個人，用於測驗、自我探索、認知落差分析。',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen text-[#3d3155]" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-white/90">❄️ SnowRealm Insight Engine</Link>
        <HomeNav />
      </nav>

      {/* Hero */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            選擇你的方案
          </span>
        </h1>
        <p className="text-slate-400 text-lg">免費開始，需要更多時再升級</p>
      </header>

      {/* C端定價 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <span className="inline-block bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full px-4 py-1">
            🧑 C 端 個人方案
          </span>
          <p className="text-slate-400 text-sm mt-2">測驗、認知落差、AI 故事報告</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {C_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-cyan-500/10 to-blue-500/5 border-cyan-400/30 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/35 border-[#b8a9e8]/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-500 text-[#3d3155] text-xs font-bold rounded-full px-3 py-1">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[#8a7ca8] text-sm font-medium mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-[#3d3155]">免費</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[#3d3155]">NT${plan.price}</span>
                      <span className="text-[#b5a8d0] text-sm">{plan.unit}</span>
                    </>
                  )}
                </div>
                {plan.unit === '永久免費' && (
                  <p className="text-[#b5a8d0] text-xs mt-1">永久免費</p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-[#8a7ca8] flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-[#3d3155]'
                    : 'border border-white/15 text-[#3d3155] hover:text-[#3d3155] hover:border-white/30'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[#b5a8d0] text-xs mt-6">
          不需信用卡 · 隨時取消 · 14 天退費保障
        </p>
      </section>

      {/* B端定價 */}
      <section className="bg-[#b8a9e8]/8 border-y border-[#b8a9e8]/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <span className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium rounded-full px-4 py-1">
              🏢 B 端 企業方案
            </span>
            <p className="text-slate-400 text-sm mt-2">問卷建立、AI 洞察、LINE CRM、多租戶管理</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {B_PLANS.map((plan) => (
              <div key={plan.name} className="relative bg-white/35 border border-[#b8a9e8]/20 rounded-[20px] backdrop-blur-sm p-6 flex flex-col">
                {'badge' in plan && plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-500 text-[#3d3155] text-xs font-bold rounded-full px-3 py-1">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-[#8a7ca8] text-sm font-medium mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-[#3d3155]">洽談</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-[#3d3155]">NT${plan.price.toLocaleString()}</span>
                        <span className="text-[#b5a8d0] text-sm">/月</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-[#8a7ca8] flex items-start gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.price === 0 ? 'mailto:hello@snowrealm.pet' : '/register?type=business'}
                  className="block text-center py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-[#3d3155] hover:text-[#3d3155] hover:border-white/30 transition-colors"
                >
                  {plan.price === 0 ? '聯繫我們' : '免費試用 30 天'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl font-bold text-white/90 text-center mb-10">常見問題</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-white/35 border border-[#b8a9e8]/20 rounded-[18px] backdrop-blur-sm p-5">
              <p className="text-[#3d3155] font-medium mb-2">{item.q}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <p className="text-2xl font-bold text-white/90 mb-3">還在觀望嗎？</p>
        <p className="text-slate-400 mb-8">免費版永久有效，3 分鐘開始你的第一份問卷</p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[#3d3155] font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          免費開始 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© 2026 SnowRealm Insight Engine</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/explore" className="hover:text-[#3d3155] transition-colors">探索問卷</Link>
            <Link href="/zcoin-shop" className="hover:text-[#3d3155] transition-colors">Z幣商店</Link>
            <Link href="/privacy" className="hover:text-[#3d3155] transition-colors">隱私權政策</Link>
            <Link href="/terms" className="hover:text-[#3d3155] transition-colors">使用者條款</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

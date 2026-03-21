'use client'

const PLANS = [
  {
    name: 'Free',
    price: 'NT$0',
    features: ['1 份問卷', '100 筆回覆/月', '基礎分析', '1 位管理員'],
    highlight: false,
    note: '現階段免費開放所有功能',
  },
  {
    name: 'Pro',
    price: 'NT$490/月',
    features: [
      '無限問卷',
      '5,000 筆回覆/月',
      '完整分析 + LINE 整合',
      '5 位管理員',
      'AI 出題（每日 50 次）',
      'A/B 測試',
      '自訂通知樣式',
    ],
    highlight: true,
    note: '最受歡迎',
  },
  {
    name: 'Enterprise',
    price: '聯繫我們',
    features: [
      '無限回覆',
      '白標客製',
      'API 存取',
      '專屬支援',
      '自訂網域',
      '無限 AI 用量',
      '優先技術支援',
    ],
    highlight: false,
    note: '客製化方案',
  },
]

const FEATURE_COMPARISON = [
  { feature: '問卷數量', free: '1', pro: '無限', enterprise: '無限' },
  { feature: '每月回覆數', free: '100', pro: '5,000', enterprise: '無限' },
  { feature: '管理員人數', free: '1', pro: '5', enterprise: '無限' },
  { feature: '數據分析', free: '基礎', pro: '完整', enterprise: '完整 + API' },
  { feature: 'LINE 整合', free: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'AI 出題', free: '免費額度', pro: '每日 50 次', enterprise: '無限' },
  { feature: 'A/B 測試', free: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Webhook', free: '1 個', pro: '10 個', enterprise: '無限' },
  { feature: '自訂網域', free: '❌', pro: '❌', enterprise: '✅' },
  { feature: '白標客製', free: '❌', pro: '❌', enterprise: '✅' },
  { feature: '技術支援', free: 'Email', pro: 'Email + LINE', enterprise: '專屬支援' },
]

export default function SuperAdminPlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">💰 收費規劃</h1>
        <p className="text-sm text-white/40 mt-1">
          ※ 目前所有功能免費開放使用，付費方案將於正式版實施。
        </p>
      </div>

      {/* 方案卡片 */}
      <div className="grid sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 ${
              plan.highlight
                ? 'bg-linear-to-br from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30'
                : 'bg-slate-900/60 border border-slate-800'
            }`}
          >
            <h3 className="text-lg font-bold text-white/90">{plan.name}</h3>
            <p className={`text-2xl font-bold mt-2 ${plan.highlight ? 'text-cyan-400' : 'text-white/70'}`}>
              {plan.price}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-white/60 flex items-center gap-2">
                  <span className="text-green-400 text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/30">{plan.note}</p>
          </div>
        ))}
      </div>

      {/* 功能比較表 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">📋 功能比較</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-3">功能</th>
                  <th className="text-center px-4 py-3">Free</th>
                  <th className="text-center px-4 py-3 text-cyan-400">Pro</th>
                  <th className="text-center px-4 py-3">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/70">{row.feature}</td>
                    <td className="px-4 py-2.5 text-center text-white/50 text-xs">{row.free}</td>
                    <td className="px-4 py-2.5 text-center text-cyan-400 text-xs font-medium">{row.pro}</td>
                    <td className="px-4 py-2.5 text-center text-amber-400 text-xs">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

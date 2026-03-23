'use client'

/**
 * 與後端計費邏輯 lib/planLimits.ts 的 PLAN_LIMITS 對齊（文案可微調，數字請同步程式）
 */
const PLANS = [
  {
    name: 'Free 免費版',
    price: 'NT$0',
    features: [
      '最多 3 份問卷',
      '每月 1,000 筆回覆',
      '1 位管理員',
      'AI 出題每日 3 次',
      'Webhook 1 個',
      '基礎分析與標籤',
    ],
    highlight: false,
    note: '適合試用與小型活動',
  },
  {
    name: 'Pro 專業版',
    price: 'NT$490/月',
    features: [
      '問卷數量無上限',
      '每月 10,000 筆回覆',
      '5 位管理員',
      'AI 出題每日 50 次',
      'Webhook 10 個',
      '完整分析、LINE、排程與進階功能',
    ],
    highlight: true,
    note: '與系統內建「專業版」方案一致',
  },
  {
    name: 'Business 商業版',
    price: 'NT$1,290/月',
    features: [
      '每月 50,000 筆回覆',
      '問卷與管理員人數無上限',
      'AI 出題無每日上限（依公平使用）',
      'Webhook 無上限',
      '適合成長型品牌與多活動並行',
    ],
    highlight: false,
    note: '高流量與多團隊協作',
  },
  {
    name: 'Enterprise 企業版',
    price: '聯繫我們',
    features: [
      '回覆與資源客製化上限',
      '白標、自訂網域與 API',
      '專屬技術與導入支援',
      'SLA、稽核與資安需求可談',
    ],
    highlight: false,
    note: '客製化合約',
  },
]

const FEATURE_COMPARISON = [
  { feature: '問卷數量', free: '最多 3', pro: '無限', business: '無限', enterprise: '無限' },
  { feature: '每月回覆數', free: '1,000', pro: '10,000', business: '50,000', enterprise: '客製' },
  { feature: '管理員人數', free: '1', pro: '5', business: '無限', enterprise: '無限' },
  { feature: 'AI 出題（每日）', free: '3 次', pro: '50 次', business: '無上限*', enterprise: '客製' },
  { feature: 'Webhook', free: '1', pro: '10', business: '無限', enterprise: '無限' },
  { feature: '數據分析', free: '基礎', pro: '完整', business: '完整', enterprise: '完整 + API' },
  { feature: 'LINE / 通知進階', free: '✅', pro: '✅', business: '✅', enterprise: '✅' },
  { feature: '自訂網域 / 白標', free: '❌', pro: '❌', business: '可加購', enterprise: '✅' },
  { feature: '技術支援', free: '社群／文件', pro: 'Email', business: '優先', enterprise: '專屬窗口' },
]

export default function SuperAdminPlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">💰 收費規劃</h1>
        <p className="text-sm text-white/40 mt-1">
          ※ 實際扣檢與訂閱以各租戶後台「訂閱」與系統限制為準；此頁為對外規劃與內部對照用。
        </p>
        <p className="text-xs text-amber-200/70 mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          規劃中（總後台可擴充）：全域公告橫幅、功能開關（Feature flags）、匯出計費報表、異常登入告警、租戶配額一鍵調整、維護模式切換。
        </p>
      </div>

      {/* 方案卡片 */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <p className="text-xs text-white/35 mb-2">* Business 版 AI 為無每日上限欄位，實際仍可能依公平使用政策調整。</p>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800 text-white/40 text-xs">
                  <th className="text-left px-4 py-3">功能</th>
                  <th className="text-center px-3 py-3">Free</th>
                  <th className="text-center px-3 py-3 text-cyan-400">Pro</th>
                  <th className="text-center px-3 py-3 text-violet-300">Business</th>
                  <th className="text-center px-3 py-3 text-amber-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/70">{row.feature}</td>
                    <td className="px-3 py-2.5 text-center text-white/50 text-xs">{row.free}</td>
                    <td className="px-3 py-2.5 text-center text-cyan-400 text-xs font-medium">{row.pro}</td>
                    <td className="px-3 py-2.5 text-center text-violet-300/90 text-xs">{row.business}</td>
                    <td className="px-3 py-2.5 text-center text-amber-400 text-xs">{row.enterprise}</td>
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

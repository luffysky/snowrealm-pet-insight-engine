import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '社群規範與平台規則 — SnowRealm Insight Engine',
  description: 'SnowRealm Insight Engine 平台使用規則、社群守則與內容政策。',
}

const RULES = [
  {
    icon: '🤝',
    title: '尊重他人',
    items: [
      '禁止對其他用戶進行人身攻擊、辱罵、騷擾或霸凌。',
      '不得發布仇恨言論，包括針對種族、性別、宗教、國籍、性取向、殘疾的歧視內容。',
      '不得發布他人私人資訊（電話、地址、個資）。',
    ],
  },
  {
    icon: '🚫',
    title: '禁止詐騙與欺詐',
    items: [
      '禁止以任何形式實施詐騙、釣魚攻擊或誘騙他人匯款。',
      '不得冒充他人身份（偽裝成他人、品牌或官方帳號）。',
      '禁止虛假宣稱產品或服務的功能、效果。',
      '透過本平台進行任何形式的詐騙行為，我們將立即封禁帳號並向主管機關舉報。',
    ],
  },
  {
    icon: '🔞',
    title: '內容規範',
    items: [
      '禁止發布色情、露骨性行為或任何不雅圖文。',
      '禁止發布暴力、血腥或煽動犯罪的內容。',
      '禁止散布假新聞、不實資訊或蓄意誤導性內容。',
      '不得發布涉及未成年人的任何不當內容。',
    ],
  },
  {
    icon: '📜',
    title: '著作權與智慧財產',
    items: [
      '不得在未經授權的情況下轉載或使用他人的著作、圖片、影音。',
      '發布問卷時，題目內容必須為原創或已取得授權。',
      '侵犯著作權的內容將被立即下架，重複違規者帳號將被永久停用。',
    ],
  },
  {
    icon: '🗑️',
    title: '垃圾訊息',
    items: [
      '禁止大量發送重複訊息、廣告或未經請求的商業訊息（SPAM）。',
      '不得建立自動化機器人帳號刷票、刷留言或操縱數據。',
      '禁止透過私訊功能對他人進行騷擾或強制推銷。',
    ],
  },
  {
    icon: '🔒',
    title: '帳號安全',
    items: [
      '一人限一個帳號。如發現多帳號規避封禁行為，所有相關帳號將一併停用。',
      '不得使用他人帳號或將帳號出售、轉讓給他人。',
      '發現帳號遭盜用，請立即聯繫客服或透過 LINE 通報。',
    ],
  },
  {
    icon: '⚖️',
    title: '法律合規',
    items: [
      '本平台依中華民國法律運營，使用者須遵守當地法律法規。',
      '涉及刑事犯罪的內容（如兒童剝削、人口販賣、毒品等）將立即舉報至執法機關。',
      '用戶應確保所發布問卷符合個資法，不得蒐集非必要的個人資料。',
    ],
  },
]

const ENFORCEMENT = [
  { level: '⚠️ 第一級', action: '警告', desc: '初次輕微違規，發出警告通知。' },
  { level: '🔇 第二級', action: '內容下架', desc: '違規內容被強制移除，帳號記錄一次違規。' },
  { level: '⏸️ 第三級', action: '暫時停用', desc: '重複違規，帳號暫停 7-30 天。' },
  { level: '🚫 第四級', action: '永久封禁', desc: '嚴重或持續違規，帳號永久停用，且不得重新註冊。' },
  { level: '🚨 法律行動', action: '司法移送', desc: '涉及詐騙、兒童剝削等刑事犯罪，直接移送司法機關。' },
]

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-amber-400 font-bold text-lg">✦ SnowRealm</Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← 回首頁</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h1 className="text-3xl font-bold mb-3">社群規範與平台規則</h1>
          <p className="text-slate-400 leading-relaxed">
            SnowRealm Insight Engine 致力於打造一個安全、誠信、有價值的平台環境。<br />
            使用本平台即代表您同意遵守以下規範。
          </p>
          <p className="text-xs text-slate-500 mt-3">最後更新：2026年3月27日</p>
        </div>

        {/* Rules */}
        <div className="space-y-8 mb-12">
          {RULES.map((section, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enforcement */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span>🔨</span>
            違規處理機制
          </h2>
          <div className="space-y-3">
            {ENFORCEMENT.map((e, i) => (
              <div key={i} className="flex gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
                <div className="shrink-0 w-28 text-sm font-medium text-white/80">{e.level}</div>
                <div>
                  <p className="text-sm font-semibold text-amber-300">{e.action}</p>
                  <p className="text-xs text-slate-400">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-400/20 rounded-2xl p-6 mb-12 text-center">
          <div className="text-3xl mb-3">🚨</div>
          <h2 className="text-lg font-semibold mb-2">發現違規？立即舉報</h2>
          <p className="text-sm text-slate-400 mb-4">
            如果您在本平台發現任何違規內容或帳號，請使用貼文上的「檢舉」按鈕，<br />
            或透過 LINE 官方帳號直接聯繫我們的管理團隊。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? 'https://line.me/R/ti/p/@474iwlht'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-[#06C755] text-white rounded-full text-sm font-medium hover:bg-[#05b34c] transition-colors"
            >
              💬 LINE 聯繫客服
            </a>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-full text-sm hover:text-white hover:bg-white/8 transition-colors"
            >
              登入後使用檢舉功能
            </Link>
          </div>
        </div>

        {/* Notice */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>本平台保留隨時修改社群規範的權利，修改後將於本頁面公告。</p>
          <p>繼續使用本平台視為接受最新版規範。如有疑問，請透過 LINE 聯繫我們。</p>
          <p className="mt-3">
            <Link href="/privacy" className="hover:text-white transition-colors mr-3">隱私政策</Link>
            <Link href="/terms" className="hover:text-white transition-colors mr-3">使用條款</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie 政策</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

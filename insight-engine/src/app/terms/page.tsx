import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '使用者條款 — SnowRealm Insight Engine',
  description: 'SnowRealm Insight Engine 使用者條款，規範您使用本平台的權利與義務。',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white/80">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-cyan-400 hover:underline text-sm">← 返回首頁</Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">使用者條款</h1>
        <p className="text-sm text-white/40 mb-10">最後更新日期：2026 年 3 月 22 日</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. 服務說明</h2>
            <p>
              SnowRealm Insight Engine（以下簡稱「本平台」）是由 SnowRealm 團隊開發與營運的線上問卷系統服務，
              提供問卷建立、資料收集、數據分析、LINE 整合等功能。使用本平台即表示您同意遵守本使用者條款。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. 帳號與註冊</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>您必須提供真實、準確的資料進行註冊</li>
              <li>每個 Email 地址僅能註冊一個帳號</li>
              <li>您有責任妥善保管帳號密碼，因帳號遭他人使用所導致的損害由您自行承擔</li>
              <li>如發現帳號遭未授權使用，請立即通知我們</li>
              <li>您不得將帳號轉讓或出借予第三方</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. 使用規範</h2>
            <p className="mb-3">使用本平台時，您同意不會進行以下行為：</p>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>違反任何適用法律法規</li>
              <li>收集或儲存他人的個人資料用於未經授權的用途</li>
              <li>建立包含非法、歧視、騷擾、色情或暴力內容的問卷</li>
              <li>使用自動化工具大量發送垃圾問卷</li>
              <li>嘗試存取未經授權的系統資源或他人帳號</li>
              <li>進行任何可能影響平台正常運作的行為（如 DDoS、注入攻擊等）</li>
              <li>複製、修改、反編譯或逆向工程本平台軟體</li>
              <li>利用本平台進行釣魚、詐騙或其他惡意行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. 問卷內容責任</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>您所建立的問卷內容由您自行負責</li>
              <li>如問卷涉及收集個資，您有義務告知填答者並取得同意</li>
              <li>您不得利用問卷收集競業禁止或法律禁止之資訊</li>
              <li>本平台保留在發現違規內容時停用或刪除問卷的權利</li>
              <li>透過問卷收集的填答資料歸該租戶管理員所有，本平台僅作為技術服務提供者</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. 多租戶架構</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>每個組織在本平台擁有獨立的租戶空間（Tenant）</li>
              <li>各租戶間的資料完全隔離，互不可見</li>
              <li>租戶管理員可邀請團隊成員加入，並管理其權限</li>
              <li>租戶管理員有責任確保團隊成員遵守本條款</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. AI 功能使用</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>本平台提供 AI 輔助出題、AI 問卷生成等功能</li>
              <li>每個租戶享有一定的免費 AI 使用額度</li>
              <li>超出免費額度後，需接入自己的 API Key 或購買額外額度</li>
              <li>AI 生成的內容僅供參考，您有責任審核其正確性與適當性</li>
              <li>使用 AI 功能時，問卷相關內容可能傳送至第三方 AI 服務（如 OpenAI）處理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. 服務變更與中斷</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>本平台可能因維護、升級而暫時中斷服務，將盡可能提前通知</li>
              <li>我們保留隨時修改、新增或移除功能的權利</li>
              <li>我們不對因服務中斷造成的任何損失承擔責任</li>
              <li>重大功能異動將透過平台公告或 Email 通知</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. 收費與方案</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>目前本平台所有核心功能免費開放使用</li>
              <li>未來可能推出付費方案，屆時將提前公告收費標準</li>
              <li>免費方案可能設有用量限制（如問卷數、回覆數、AI 額度等）</li>
              <li>付費方案的取消與退費政策將於推出時另行公告</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. 智慧財產權</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>本平台的軟體、設計、商標及相關智慧財產權歸 SnowRealm 團隊所有</li>
              <li>您所建立的問卷內容、收集到的填答資料歸您所有</li>
              <li>您授權本平台在提供服務的範圍內處理您的資料</li>
              <li>您不得侵犯他人智慧財產權</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. 帳號終止</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>您可隨時要求刪除帳號及相關資料</li>
              <li>如違反本條款，我們有權暫停或終止您的帳號</li>
              <li>帳號終止後，您的資料將依隱私權政策規定的期限處理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. 免責聲明</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>本平台按「現狀」提供，不提供任何明示或暗示的保證</li>
              <li>我們不保證服務完全不會中斷或不含錯誤</li>
              <li>對於因使用本平台所導致的間接、附隨或懲罰性損害，我們不承擔責任</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. 條款修訂</h2>
            <p>
              我們保留隨時修訂本條款的權利。修訂後將於本頁面公告，重大變更將另行通知。
              繼續使用本平台即表示您同意修訂後的條款。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. 準據法</h2>
            <p>
              本條款依中華民國法律解釋。如有爭議，雙方同意以台灣台北地方法院為第一審管轄法院。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. 聯絡方式</h2>
            <p>
              如有任何關於使用條款的疑問，請聯繫：
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/60 mt-2">
              <li>Email：<a href="mailto:support@snowrealm.pet" className="text-cyan-400 hover:underline">support@snowrealm.pet</a></li>
              <li>營運團隊：SnowRealm</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-white/40">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">隱私權政策</Link>
          <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookie 政策</Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">登入</Link>
          <Link href="/register" className="hover:text-white/60 transition-colors">註冊</Link>
        </div>
      </div>
    </div>
  )
}

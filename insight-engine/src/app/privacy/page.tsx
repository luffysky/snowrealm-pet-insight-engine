import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '隱私權政策 — SnowRealm Insight Engine',
  description: 'SnowRealm Insight Engine 隱私權政策，說明我們如何收集、使用及保護您的個人資訊。',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white/80">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-cyan-400 hover:underline text-sm">← 返回首頁</Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">隱私權政策</h1>
        <p className="text-sm text-white/40 mb-10">最後更新日期：2026 年 3 月 22 日</p>

        <div className="space-y-8 text-sm leading-relaxed lg-light-sharp lg-xl p-6 rounded-2xl">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. 總則</h2>
            <p>
              SnowRealm Insight Engine（以下簡稱「本平台」）由 SnowRealm 團隊營運，致力於保護使用者的隱私權。本隱私權政策說明我們如何收集、使用、儲存及保護您的個人資料，適用於所有透過本平台提供的服務。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. 我們收集的資料</h2>
            <p className="mb-3">根據您使用本平台的方式，我們可能收集以下類型的資料：</p>
            <h3 className="font-medium text-white/90 mt-4 mb-2">2.1 管理員帳號資料</h3>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>電子郵件地址（用於登入驗證及通知）</li>
              <li>顯示名稱（用於後台識別）</li>
              <li>密碼（以 scrypt 演算法加密儲存，無法被還原）</li>
              <li>Google 帳號資訊（若使用 Google OAuth 登入）</li>
              <li>LINE 帳號資訊（若使用 LINE 登入或綁定）</li>
            </ul>
            <h3 className="font-medium text-white/90 mt-4 mb-2">2.2 問卷填答者資料</h3>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>問卷回答內容（由問卷建立者設計的問題與選項）</li>
              <li>LINE 使用者 ID 及顯示名稱（若透過 LINE 進入問卷）</li>
              <li>UTM 追蹤參數（來源、媒介、活動名稱）</li>
              <li>填答時間紀錄</li>
            </ul>
            <h3 className="font-medium text-white/90 mt-4 mb-2">2.3 自動收集的資料</h3>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>瀏覽器類型與版本</li>
              <li>裝置類型</li>
              <li>IP 位址（僅供安全防護使用，不做追蹤用途）</li>
              <li>Cookie 及類似技術（詳見 <Link href="/cookies" className="text-cyan-400 hover:underline">Cookie 政策</Link>）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. 資料使用目的</h2>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>提供及維護本平台服務</li>
              <li>處理帳號註冊、登入驗證</li>
              <li>發送服務相關通知（如問卷填答通知、系統公告）</li>
              <li>改善產品功能與使用者體驗</li>
              <li>確保平台安全並預防濫用行為</li>
              <li>依法配合主管機關要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. 資料儲存與安全</h2>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>所有資料儲存於具備安全防護的 PostgreSQL 資料庫</li>
              <li>密碼使用 scrypt 加密演算法處理，無法被還原為明文</li>
              <li>所有 API 通訊採用 HTTPS 加密傳輸</li>
              <li>管理員驗證採用 JWT Token 機制，透過 httpOnly Cookie 儲存</li>
              <li>敏感設定（如 LINE API 金鑰）在資料庫中加密儲存</li>
              <li>我們定期審查安全措施並進行必要更新</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. 資料分享與第三方</h2>
            <p className="mb-3">我們不會出售您的個人資料。在以下情況下，我們可能與第三方共享資料：</p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li><strong>LINE Corporation：</strong>當您使用 LINE 相關功能時，您的 LINE 使用者 ID 將透過 LINE Messaging API 傳輸</li>
              <li><strong>Google：</strong>當您使用 Google OAuth 登入時，將透過 Google API 進行身份驗證</li>
              <li><strong>Resend（Email 服務）：</strong>用於寄送驗證碼及通知信件</li>
              <li><strong>Cloudflare R2：</strong>用於圖片及檔案儲存</li>
              <li><strong>OpenAI：</strong>當管理員啟用 AI 功能（如 AI 出題）時，問卷相關內容可能傳送至 OpenAI API 處理</li>
              <li><strong>法律要求：</strong>若收到合法的法律程序要求，我們可能依法揭露相關資料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. 使用者權利</h2>
            <p className="mb-3">根據《個人資料保護法》，您享有以下權利：</p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>查詢或請求閱覽您的個人資料</li>
              <li>請求製作個人資料副本</li>
              <li>請求補充或更正您的個人資料</li>
              <li>請求停止蒐集、處理或利用您的個人資料</li>
              <li>請求刪除您的個人資料</li>
            </ul>
            <p className="mt-3">
              如需行使上述權利，請透過電子郵件聯繫我們：
              <a href="mailto:service@snowrealm.pet" className="text-cyan-400 hover:underline">service@snowrealm.pet</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. 資料保留期限</h2>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>管理員帳號資料：自帳號刪除後 30 天內清除</li>
              <li>問卷填答資料：依管理員設定保留，或在問卷刪除後 90 天內清除</li>
              <li>Email 驗證碼：發送後 10 分鐘自動過期</li>
              <li>邀請連結：7 天內未使用自動失效</li>
              <li>系統日誌：保留 90 天後自動清除</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. 兒童隱私</h2>
            <p>
              本平台不針對 16 歲以下兒童提供服務。若我們發現不慎收集了兒童的個人資料，將會立即刪除。如果您認為我們可能持有兒童的資料，請聯繫我們。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. 政策變更</h2>
            <p>
              我們可能不定期更新本隱私權政策。重大變更將透過平台公告或電子郵件通知。繼續使用本平台即表示您同意更新後的政策內容。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. 聯絡方式</h2>
            <p>
              如有關於隱私權政策的任何疑問，請聯繫：
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/60 mt-2">
              <li>Email：<a href="mailto:service@snowrealm.pet" className="text-cyan-400 hover:underline">service@snowrealm.pet</a></li>
              <li>營運團隊：SnowRealm</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-white/40">
          <Link href="/terms" className="hover:text-white/60 transition-colors">使用者條款</Link>
          <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookie 政策</Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">登入</Link>
          <Link href="/register" className="hover:text-white/60 transition-colors">註冊</Link>
        </div>
      </div>
    </div>
  )
}

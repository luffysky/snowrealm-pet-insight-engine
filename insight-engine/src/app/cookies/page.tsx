import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie 政策 — SnowRealm Insight Engine',
  description: 'SnowRealm Insight Engine Cookie 政策，說明我們如何使用 Cookie 與類似技術。',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white/80">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-cyan-400 hover:underline text-sm">← 返回首頁</Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Cookie 政策</h1>
        <p className="text-sm text-white/40 mb-10">最後更新日期：2026 年 3 月 22 日</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. 什麼是 Cookie？</h2>
            <p>
              Cookie 是網站儲存在您瀏覽器中的小型文字檔案。它們用來記住您的偏好設定、維持登入狀態，
              以及了解您如何使用我們的服務。本平台使用 Cookie 來確保系統正常運作與安全。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. 我們使用的 Cookie</h2>

            <h3 className="font-medium text-white/90 mt-4 mb-3">2.1 必要性 Cookie（Essential）</h3>
            <p className="text-white/60 mb-3">
              這些 Cookie 是平台運作所必需的，無法被關閉。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-white/40">
                    <th className="text-left py-2 px-3">Cookie 名稱</th>
                    <th className="text-left py-2 px-3">用途</th>
                    <th className="text-left py-2 px-3">類型</th>
                    <th className="text-left py-2 px-3">保存期限</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-3 font-mono text-cyan-400">admin_session</td>
                    <td className="py-2 px-3">管理員登入驗證（JWT Token）</td>
                    <td className="py-2 px-3">httpOnly, Secure</td>
                    <td className="py-2 px-3">24 小時</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-medium text-white/90 mt-6 mb-3">2.2 功能性 Cookie（Functional）</h3>
            <p className="text-white/60 mb-3">
              這些 Cookie 記住您的偏好設定，提供更好的使用體驗。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-white/40">
                    <th className="text-left py-2 px-3">Cookie 名稱</th>
                    <th className="text-left py-2 px-3">用途</th>
                    <th className="text-left py-2 px-3">類型</th>
                    <th className="text-left py-2 px-3">保存期限</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-3 font-mono text-cyan-400">theme_preference</td>
                    <td className="py-2 px-3">記住問卷填答者選擇的主題</td>
                    <td className="py-2 px-3">一般</td>
                    <td className="py-2 px-3">30 天</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-medium text-white/90 mt-6 mb-3">2.3 我們不使用的 Cookie</h3>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>我們<strong className="text-white/80">不使用</strong>第三方廣告追蹤 Cookie</li>
              <li>我們<strong className="text-white/80">不使用</strong> Google Analytics 或 Facebook Pixel</li>
              <li>我們<strong className="text-white/80">不使用</strong>跨站追蹤技術</li>
              <li>我們<strong className="text-white/80">不會</strong>將 Cookie 資料出售給第三方</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. 第三方 Cookie</h2>
            <p className="mb-3">
              在特定功能中，第三方服務可能會設定自己的 Cookie：
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li><strong className="text-white/80">Google OAuth：</strong>使用 Google 登入時，Google 會設定認證相關 Cookie</li>
              <li><strong className="text-white/80">LINE Login：</strong>使用 LINE 登入時，LINE 會設定認證相關 Cookie</li>
            </ul>
            <p className="mt-3 text-white/60">
              這些第三方 Cookie 受各自公司的隱私權政策管理，我們無法控制其行為。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cookie 安全性</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li><strong className="text-white/80">httpOnly：</strong>登入 Cookie 設定為 httpOnly，JavaScript 無法讀取，防止 XSS 攻擊竊取</li>
              <li><strong className="text-white/80">Secure：</strong>在正式環境中，Cookie 僅透過 HTTPS 傳輸</li>
              <li><strong className="text-white/80">SameSite = Lax：</strong>防止跨站請求偽造（CSRF）攻擊</li>
              <li><strong className="text-white/80">JWT 加密：</strong>Session Cookie 內容為加密的 JWT Token，無法被篡改</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. 管理您的 Cookie</h2>
            <p className="mb-3">
              您可以透過瀏覽器設定管理或刪除 Cookie。請注意，停用必要性 Cookie 將導致您無法正常使用本平台。
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li><strong className="text-white/80">Chrome：</strong>設定 → 隱私權和安全性 → Cookie</li>
              <li><strong className="text-white/80">Firefox：</strong>設定 → 隱私與安全性 → Cookie 與網站資料</li>
              <li><strong className="text-white/80">Safari：</strong>偏好設定 → 隱私權 → 管理網站資料</li>
              <li><strong className="text-white/80">Edge：</strong>設定 → Cookie 和網站權限</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. 政策更新</h2>
            <p>
              我們可能不定期更新本 Cookie 政策。更新後將於本頁面公告，繼續使用本平台即表示您同意更新後的政策。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. 聯絡方式</h2>
            <p>如有關於 Cookie 的任何疑問，請聯繫：</p>
            <ul className="list-disc list-inside space-y-1 text-white/60 mt-2">
              <li>Email：<a href="mailto:service@snowrealm.pet" className="text-cyan-400 hover:underline">service@snowrealm.pet</a></li>
              <li>營運團隊：SnowRealm</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-white/40">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">隱私權政策</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">使用者條款</Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">登入</Link>
          <Link href="/register" className="hover:text-white/60 transition-colors">註冊</Link>
        </div>
      </div>
    </div>
  )
}

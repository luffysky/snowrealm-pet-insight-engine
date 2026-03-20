export default function LineSettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white/90">LINE 帳號設定指南</h1>

      {/* Official Account Manager */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">1. LINE Official Account Manager</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          前往{' '}
          <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
            manager.line.biz
          </a>{' '}
          管理官方帳號的基本資料。
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">帳號名稱</strong>：設定顯示名稱（如「毛行天下」）</li>
          <li><strong className="text-slate-300">大頭貼</strong>：上傳品牌 Logo（建議 640×640 px）</li>
          <li><strong className="text-slate-300">狀態消息</strong>：設定一行簡短描述</li>
          <li><strong className="text-slate-300">帳號簡介</strong>：詳細介紹你的服務</li>
        </ul>
      </section>

      {/* 回應設定 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">2. 回應設定（重要！）</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          路徑：LINE Official Account Manager → 設定 → 回應設定
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">回應模式</strong>：選擇 <code className="bg-slate-700 px-1 rounded text-cyan-300">Bot</code>（非聊天模式）</li>
          <li><strong className="text-slate-300">自動回應訊息</strong>：<code className="bg-slate-700 px-1 rounded text-red-300">停用</code>（由 Webhook API 處理）</li>
          <li><strong className="text-slate-300">加入好友的歡迎訊息</strong>：可保留啟用，或由 Webhook 處理</li>
          <li><strong className="text-slate-300">Webhook</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">啟用</code></li>
        </ul>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300">
          ⚠️ 必須關閉「自動回應訊息」，否則會跟 API 的自動回覆衝突（使用者會收到兩則訊息）
        </div>
      </section>

      {/* Webhook 設定 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">3. Webhook URL 設定</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          路徑：LINE Developers Console → Messaging API → Webhook settings
        </p>
        <div className="space-y-3">
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">官方帳號 @474iwlht（用戶互動）</p>
            <code className="text-sm text-green-300 break-all">
              https://insight-engine-sonwrealm-pet.zeabur.app/api/line/webhook/official
            </code>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">INSIGHT @762wxvfb（管理員通知）</p>
            <code className="text-sm text-green-300 break-all">
              https://insight-engine-sonwrealm-pet.zeabur.app/api/line/webhook
            </code>
          </div>
        </div>
      </section>

      {/* LIFF 設定 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">4. LIFF 設定（選用）</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          路徑：LINE Developers Console → 官方帳號 Channel → LIFF
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li>建立新的 LIFF app，Type 選 <code className="bg-slate-700 px-1 rounded text-cyan-300">Full</code></li>
          <li>Endpoint URL：<code className="bg-slate-700 px-1 rounded text-green-300">https://insight-engine-sonwrealm-pet.zeabur.app/liff</code></li>
          <li>Scope：勾選 <code className="bg-slate-700 px-1 rounded">profile</code></li>
          <li>取得 LIFF ID 後，設定環境變數 <code className="bg-slate-700 px-1 rounded text-cyan-300">NEXT_PUBLIC_LIFF_ID</code></li>
        </ul>
      </section>

      {/* Rich Menu */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">5. Rich Menu</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Rich Menu 已透過 API 自動建立並設為預設。如需重新部署：
        </p>
        <div className="bg-slate-900 rounded-lg p-3">
          <code className="text-sm text-green-300">
            node --env-file=.env.local scripts/setup-rich-menu.mjs
          </code>
        </div>
      </section>

      {/* Cron Jobs */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">6. 排程任務（Cron）</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          可在 Zeabur 或外部排程服務設定以下 Cron Job：
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li>
            <strong className="text-slate-300">問卷提醒</strong>：每天一次<br/>
            <code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/remind</code>
          </li>
          <li>
            <strong className="text-slate-300">排程推播</strong>：每分鐘一次<br/>
            <code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/broadcast</code>
          </li>
          <li>
            <strong className="text-slate-300">週報推播</strong>：每週一次（建議週一 10:00）<br/>
            <code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/weekly-report</code>
          </li>
        </ul>
      </section>
    </div>
  )
}

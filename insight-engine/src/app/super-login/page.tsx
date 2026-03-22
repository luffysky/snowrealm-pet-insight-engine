'use client'

export default function SuperAdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-amber-400">⚡ SIE 系統控制台</h1>
            <p className="text-sm text-slate-400 mt-2">SnowRealm Insight Engine 總後台</p>
            <p className="text-xs text-slate-600 mt-1">僅限系統管理員</p>
          </div>

          <button
            onClick={() => { window.location.href = '/api/auth/line/super-admin' }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#06C755] hover:bg-[#05b54e] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.8.22.92.51.11.26.07.66.04.93l-.15.87c-.04.25-.2.97.85.53s5.6-3.3 7.64-5.64C21.97 14.22 22 12.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>
            使用 LINE 登入總後台
          </button>

          <p className="text-xs text-slate-600 text-center">
            此登入入口僅綁定管理員的 LINE 帳號
          </p>

          <div className="flex justify-center gap-3 text-xs text-slate-600">
            <a href="/login" className="hover:text-slate-400 transition-colors">← 一般登入</a>
          </div>
        </div>
      </div>
    </div>
  )
}

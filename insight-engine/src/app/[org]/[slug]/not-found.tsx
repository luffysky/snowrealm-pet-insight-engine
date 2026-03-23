import Link from 'next/link'

/** 公開問卷 /{org}/{slug} 找不到時（常見：問卷仍為 draft、slug 打錯、租戶代碼不符） */
export default function OrgSurveyNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 bg-slate-950 text-center">
      <p className="text-6xl font-bold text-slate-700 mb-2">404</p>
      <h1 className="text-xl font-semibold text-white/90 mb-3">找不到這份問卷</h1>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        可能原因：問卷尚未<strong className="text-slate-300">發布（published）</strong>、網址中的租戶代碼或 slug
        有誤，或問卷已下架。
      </p>
      <p className="text-xs text-slate-500 max-w-md mb-8">
        若您是管理員：請到後台「問卷管理」確認狀態為 <code className="text-cyan-400/90">published</code>，並使用畫面上顯示的完整連結（含正確租戶路徑）。
      </p>
      <Link
        href="/"
        className="text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
      >
        回到首頁
      </Link>
    </div>
  )
}

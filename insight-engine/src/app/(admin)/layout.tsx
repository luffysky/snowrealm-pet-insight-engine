import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-8">
          <Link
            href="/admin"
            className="text-lg font-bold text-white/90"
          >
            🐾 毛行天下後台
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/surveys"
              className="text-slate-400 hover:text-white transition-colors"
            >
              問卷管理
            </Link>
            <Link
              href="/admin/responses"
              className="text-slate-400 hover:text-white transition-colors"
            >
              填答列表
            </Link>
            <Link
              href="/admin/funnel"
              className="text-slate-400 hover:text-white transition-colors"
            >
              漏斗分析
            </Link>
            <Link
              href="/admin/crosstab"
              className="text-slate-400 hover:text-white transition-colors"
            >
              交叉分析
            </Link>
            <Link
              href="/admin/tags"
              className="text-slate-400 hover:text-white transition-colors"
            >
              標籤統計
            </Link>
            <Link
              href="/admin/utm"
              className="text-slate-400 hover:text-white transition-colors"
            >
              來源分析
            </Link>
            <Link
              href="/admin/ab"
              className="text-slate-400 hover:text-white transition-colors"
            >
              A/B 比較
            </Link>
            <Link
              href="/admin/webhooks"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Webhook
            </Link>
            <Link
              href="/admin/waitlist"
              className="text-slate-400 hover:text-white transition-colors"
            >
              封測名單
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

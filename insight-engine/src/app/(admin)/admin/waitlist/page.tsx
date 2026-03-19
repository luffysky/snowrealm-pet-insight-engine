import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminWaitlistPage() {
  const [entries, totalRow] = await Promise.all([
    query<{
      id: string
      email: string
      nickname: string
      contact_info: string
      response_id: string | null
      source: string | null
      created_at: string
    }>(
      'SELECT id, email, nickname, contact_info, response_id, source, created_at FROM waitlist ORDER BY created_at DESC'
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM waitlist'
    ),
  ])

  const total = parseInt(totalRow?.count ?? '0', 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">封測名單</h1>
        <p className="text-sm text-slate-400">共 {total} 人</p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500">
          尚無報名資料
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">
                    暱稱
                  </th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">
                    聯繫方式
                  </th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">
                    來源
                  </th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">
                    加入時間
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20"
                  >
                    <td className="px-6 py-3 text-white/90">
                      {entry.nickname || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-3 text-white/90">{entry.email}</td>
                    <td className="px-6 py-3 text-cyan-400/80 text-sm">
                      {entry.contact_info || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {entry.source ?? '-'}
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {formatDateTime(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

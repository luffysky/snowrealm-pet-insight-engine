import { getResponseDetail } from '@/lib/stats'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ResponseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResponseDetailPage({
  params,
}: ResponseDetailPageProps) {
  const { id } = await params
  const detail = await getResponseDetail(id)

  if (!detail) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/responses"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-white">填答詳情</h1>
      </div>

      {/* 基本資訊 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">基本資訊</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">狀態</p>
            <p className="text-white">
              {detail.status === 'completed' ? '已完成' : '進行中'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">來源</p>
            <p className="text-white">{detail.utmSource ?? detail.source ?? '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">提交時間</p>
            <p className="text-white">
              {detail.submittedAt
                ? new Date(detail.submittedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">建立時間</p>
            <p className="text-white">
              {new Date(detail.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
            </p>
          </div>
        </div>
      </div>

      {/* 標籤 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">CRM 標籤</h2>
        <div className="flex flex-wrap gap-2">
          {detail.tags.length === 0 && (
            <p className="text-slate-500 text-sm">尚無標籤</p>
          )}
          {detail.tags.map((tag) => (
            <span
              key={`${tag.key}-${tag.value}`}
              className="px-3 py-1 bg-slate-700/60 text-slate-200 rounded-lg text-sm"
            >
              {tag.key}: <span className="text-cyan-300">{tag.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 問答內容 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">問答內容</h2>
        {detail.answers.map((answer) => (
          <div
            key={answer.questionKey}
            className="border-b border-slate-700/30 pb-3 last:border-0"
          >
            <p className="text-sm text-slate-400 mb-1">
              {answer.questionKey.toUpperCase()}. {answer.questionContent}
            </p>
            <p className="text-white">
              {Array.isArray(answer.value)
                ? answer.value.join('、')
                : answer.value || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

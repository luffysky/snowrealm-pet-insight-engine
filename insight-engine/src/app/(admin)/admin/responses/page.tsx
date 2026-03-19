import { getResponseList } from '@/lib/stats'
import { ResponseTable } from '@/components/admin'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { ResponseFilters } from './ResponseFilters'

export const dynamic = 'force-dynamic'

interface AdminResponsesPageProps {
  searchParams: Promise<{ page?: string; status?: string; source?: string }>
}

export default async function AdminResponsesPage({
  searchParams,
}: AdminResponsesPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))
  const statusFilter = params.status || undefined
  const sourceFilter = params.source || undefined

  const result = await getResponseList(currentPage, DEFAULT_PAGE_SIZE, {
    status: statusFilter,
    source: sourceFilter,
  })
  const totalPages = Math.ceil(result.total / DEFAULT_PAGE_SIZE)

  const filterQuery = new URLSearchParams()
  if (statusFilter) filterQuery.set('status', statusFilter)
  if (sourceFilter) filterQuery.set('source', sourceFilter)
  const filterStr = filterQuery.toString()
  const paginationBase = `/admin/responses${filterStr ? `?${filterStr}&` : '?'}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">填答列表</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">共 {result.total} 筆</p>
          <a
            href="/api/admin/export"
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
          >
            匯出 CSV
          </a>
        </div>
      </div>

      <ResponseFilters
        currentStatus={statusFilter}
        currentSource={sourceFilter}
      />

      <ResponseTable
        responses={result.data}
        showPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginationBase={paginationBase}
      />
    </div>
  )
}

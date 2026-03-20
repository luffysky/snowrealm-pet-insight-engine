'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResponseTable } from '@/components/admin'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import { ResponseFilters } from './ResponseFilters'
import type { ResponseListItem } from '@/types'

const PAGE_SIZE = 20

export default function AdminResponsesPage() {
  return (
    <Suspense fallback={<p className="text-slate-400 animate-pulse">載入中…</p>}>
      <ResponsesInner />
    </Suspense>
  )
}

function ResponsesInner() {
  const { selectedSurveyId } = useAdminSurvey()
  const searchParams = useSearchParams()

  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const statusFilter = searchParams.get('status') || undefined
  const sourceFilter = searchParams.get('source') || undefined

  const [responses, setResponses] = useState<ResponseListItem[]>([])
  const [total, setTotal] = useState(0)
  const [lineClicks, setLineClicks] = useState(0)
  const [igClicks, setIgClicks] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSurveyId) return
    setLoading(true)
    const q = new URLSearchParams()
    q.set('surveyId', selectedSurveyId)
    q.set('page', String(currentPage))
    q.set('pageSize', String(PAGE_SIZE))
    if (statusFilter) q.set('status', statusFilter)
    if (sourceFilter) q.set('source', sourceFilter)

    fetch(`/api/admin/responses?${q}`)
      .then((r) => r.json())
      .then((result) => {
        setResponses(result.data ?? [])
        setTotal(result.total ?? 0)
        setLineClicks(result.lineClicks ?? 0)
        setIgClicks(result.igClicks ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedSurveyId, currentPage, statusFilter, sourceFilter])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const filterQuery = new URLSearchParams()
  if (statusFilter) filterQuery.set('status', statusFilter)
  if (sourceFilter) filterQuery.set('source', sourceFilter)
  const filterStr = filterQuery.toString()
  const paginationBase = `/admin/responses${filterStr ? `?${filterStr}&` : '?'}`

  const exportUrl = selectedSurveyId
    ? `/api/admin/export?surveyId=${selectedSurveyId}`
    : '/api/admin/export'

  if (loading) return <p className="text-slate-400 animate-pulse">載入中…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">填答列表</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-slate-400">共 {total} 筆</p>
          <span className="text-sm text-green-400">LINE {lineClicks}</span>
          <span className="text-sm text-purple-400">IG {igClicks}</span>
          <a
            href={exportUrl}
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
        responses={responses}
        showPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginationBase={paginationBase}
      />
    </div>
  )
}

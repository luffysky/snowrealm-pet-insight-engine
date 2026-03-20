import { getResponseDetail } from '@/lib/stats'
import { notFound } from 'next/navigation'
import { ResponseDetailClient } from './ResponseDetailClient'

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

  return <ResponseDetailClient detail={detail} />
}

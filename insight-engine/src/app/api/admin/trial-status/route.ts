import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { getTrialStatus } from '@/lib/trialEngine'
import { queryOne } from '@/lib/db'

interface AssetCountRow extends Record<string, unknown> {
  surveys: string
  responses: string
  tags: string
}

async function getAccumulatedAssets(tenantId: string) {
  const row = await queryOne<AssetCountRow>(
    `SELECT
       (SELECT COUNT(*)::TEXT FROM surveys WHERE tenant_id = $1) AS surveys,
       (SELECT COUNT(*)::TEXT FROM responses r JOIN surveys s ON r.survey_id = s.id WHERE s.tenant_id = $1) AS responses,
       (SELECT COUNT(*)::TEXT FROM user_tags WHERE tenant_id = $1) AS tags`,
    [tenantId]
  )
  return {
    surveys: parseInt(row?.surveys ?? '0', 10),
    responses: parseInt(row?.responses ?? '0', 10),
    tags: parseInt(row?.tags ?? '0', 10),
  }
}

export async function GET() {
  const ctx = await requireRole('viewer')
  if (ctx instanceof NextResponse) return ctx

  const [trialStatus, assets] = await Promise.all([
    getTrialStatus(ctx.tenantId),
    getAccumulatedAssets(ctx.tenantId),
  ])

  return NextResponse.json({
    status: trialStatus.status,
    daysRemaining: trialStatus.daysRemaining,
    isExpired: trialStatus.isExpired,
    canAccessAI: trialStatus.canAccessAI,
    assets,
  })
}

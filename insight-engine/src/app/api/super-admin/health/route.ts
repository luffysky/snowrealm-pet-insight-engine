import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

const TRACKED_TABLES = [
  'tenants',
  'admin_users',
  'surveys',
  'responses',
  'ai_usage_logs',
  'support_tickets',
  'audit_logs',
  'subscriptions',
] as const

const ENV_KEYS = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'ADMIN_SECRET',
  'R2_ACCESS_KEY_ID',
  'GOOGLE_CLIENT_ID',
  'LINE_LOGIN_CHANNEL_ID',
  'MIG_MERCHANT_ID',
  'RESEND_API_KEY',
  'AWS_SNS_ACCESS_KEY_ID',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_LIFF_ID',
  'SUPER_ADMIN_LINE_USER_ID',
] as const

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  try {
    const tableList = TRACKED_TABLES.map(t => `'${t}'`).join(',')

    const [dbSizeResult, tableRows] = await Promise.all([
      queryOne<{ db_size: string }>(
        `SELECT pg_database_size(current_database()) AS db_size`
      ),
      query<{ relname: string; n_live_tup: string }>(
        `SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE relname IN (${tableList})`
      ),
    ])

    const tableCounts: Record<string, number> = {}
    for (const table of TRACKED_TABLES) {
      tableCounts[table] = 0
    }
    for (const row of tableRows) {
      tableCounts[row.relname] = Number(row.n_live_tup)
    }

    const envStatus: Record<string, boolean> = {}
    for (const key of ENV_KEYS) {
      envStatus[key] = !!process.env[key]
    }

    return NextResponse.json({
      dbSizeBytes: Number(dbSizeResult?.db_size ?? 0),
      tableCounts,
      envStatus,
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Health check failed:', e)
    return NextResponse.json({ error: '健康檢查失敗' }, { status: 500 })
  }
}

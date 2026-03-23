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

function envNonEmpty(key: string): boolean {
  const v = process.env[key]
  return typeof v === 'string' && v.trim().length > 0
}

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

    const hasOpenAiEnv = envNonEmpty('OPENAI_API_KEY')
    const hasOpenAiDb = !!(await queryOne<{ ok: string }>(
      `SELECT '1' AS ok FROM ai_provider_configs
       WHERE encrypted_api_key IS NOT NULL AND length(trim(encrypted_api_key)) > 0 LIMIT 1`,
    ))

    const hasNewebMerchant =
      envNonEmpty('MIG_MERCHANT_ID') || envNonEmpty('NEWEBPAY_MERCHANT_ID')

    const envStatus: Record<string, boolean> = {}
    for (const key of ENV_KEYS) {
      envStatus[key] = envNonEmpty(key)
    }
    // 與實際功能對齊：避免「已設定卻顯示未設定」
    envStatus.OPENAI_API_KEY = hasOpenAiEnv || hasOpenAiDb
    envStatus.MIG_MERCHANT_ID = hasNewebMerchant
    envStatus.SUPER_ADMIN_LINE_USER_ID =
      envNonEmpty('SUPER_ADMIN_LINE_USER_ID') || envNonEmpty('LINE_YOUR_USER_ID')
    envStatus.NEXT_PUBLIC_LIFF_ID = envNonEmpty('NEXT_PUBLIC_LIFF_ID')

    return NextResponse.json({
      dbSizeBytes: Number(dbSizeResult?.db_size ?? 0),
      tableCounts,
      envStatus,
      envLegend: [
        'OPENAI_API_KEY：後台「AI 設定」已儲存任一租戶的 Key 時，亦顯示為已設定。',
        'MIG_MERCHANT_ID：與 NEWEBPAY_MERCHANT_ID 擇一即可（藍新商店代號）。',
        'SUPER_ADMIN_LINE_USER_ID：與 LINE_YOUR_USER_ID 擇一即可（總後台 LINE 登入白名單）。',
        '變數若在平台新增後未重建，請重新部署或重啟服務，讓執行中的 Node 讀到新環境變數。',
      ],
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Health check failed:', e)
    return NextResponse.json({ error: '健康檢查失敗' }, { status: 500 })
  }
}

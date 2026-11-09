import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'

let _pool: Pool | null = null

/** 取得 PostgreSQL connection pool（伺服器端專用） */
export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL environment variable')
    }
    // sslmode 留在連線字串會蓋掉下面的 ssl 設定，所以先拿掉
    const url = new URL(connectionString)
    const useSsl = url.searchParams.get('sslmode') === 'require'
    url.searchParams.delete('sslmode')
    const onVercel = !!process.env.VERCEL
    _pool = new Pool({
      connectionString: url.toString(),
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      // serverless 每個實例各一個 pool，連線數要壓低並快速釋放
      max: onVercel ? 5 : 20,
      idleTimeoutMillis: onVercel ? 5000 : 30000,
      connectionTimeoutMillis: onVercel ? 10000 : 5000,
    })
    if (onVercel) attachDatabasePool(_pool)
  }
  return _pool
}

/** 執行單一 SQL 查詢 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await getPool().query<T>(text, params)
  return rows
}

/** 執行 SQL 並回傳第一筆 */
export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** 執行 SQL 並回傳影響的行數 */
export async function execute(text: string, params?: unknown[]): Promise<number> {
  const result = await getPool().query(text, params)
  return result.rowCount ?? 0
}

import { Pool } from 'pg'

let _pool: Pool | null = null

/** 取得 PostgreSQL connection pool（伺服器端專用） */
export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL environment variable')
    }
    _pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
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

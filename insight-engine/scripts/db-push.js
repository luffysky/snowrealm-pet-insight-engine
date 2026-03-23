const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ 請設定 DATABASE_URL 環境變數')
  console.error('   範例: DATABASE_URL=postgresql://user:pass@host:port/db npm run db:push')
  process.exit(1)
}

const sqlPath = path.join(__dirname, '..', 'supabase', 'migration.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

function pgSslOption() {
  if (process.env.DATABASE_SSL === 'false') return false
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false }
  if (/sslmode=require|sslmode=verify-full|sslmode=prefer/i.test(DATABASE_URL)) {
    return { rejectUnauthorized: false }
  }
  return false
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: pgSslOption(),
  })
  try {
    await client.connect()
    console.log('🔗 已連線資料庫')
    await client.query(sql)
    console.log('✅ migration.sql 執行成功')

    const { rows } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    )
    console.log('📋 public schema 表：', rows.map((r) => r.tablename).join(', '))
  } catch (err) {
    console.error('❌ 執行失敗:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

// Run: node scripts/run_migration_ai.cjs
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: false })
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migration_phase10_ai.sql'),
    'utf-8'
  )
  console.log('Running migration_phase10_ai.sql ...')
  await pool.query(sql)
  console.log('Done!')

  const configs = await pool.query('SELECT COUNT(*)::text AS count FROM ai_provider_configs')
  console.log(`ai_provider_configs: ${configs.rows[0].count} rows`)

  const usage = await pool.query('SELECT COUNT(*)::text AS count FROM ai_usage_logs')
  console.log(`ai_usage_logs: ${usage.rows[0].count} rows`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

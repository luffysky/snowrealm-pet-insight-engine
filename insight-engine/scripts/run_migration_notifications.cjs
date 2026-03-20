// Run: node scripts/run_migration_notifications.cjs
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: false })
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migration_phase8_notifications.sql'),
    'utf-8'
  )
  console.log('Running migration_phase8_notifications.sql ...')
  await pool.query(sql)
  console.log('Done!')

  const rows = await pool.query('SELECT id, name, condition_type, action_type, is_active FROM notification_rules')
  console.log(`notification_rules: ${rows.rowCount} rows`)
  rows.rows.forEach((r) => console.log(`  [${r.is_active ? 'ON' : 'OFF'}] ${r.name} (${r.condition_type} → ${r.action_type})`))

  const logCount = await pool.query('SELECT COUNT(*)::text AS count FROM notification_logs')
  console.log(`notification_logs: ${logCount.rows[0].count} rows`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

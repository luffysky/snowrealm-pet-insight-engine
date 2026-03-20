// Run: node scripts/run_migration_templates_utm.cjs
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:3n25zPNSZyU64T9QrAmxX817WGk0RYwc@43.167.237.37:30465/postgres'

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: false })
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migration_phase9_templates_utm.sql'),
    'utf-8'
  )
  console.log('Running migration_phase9_templates_utm.sql ...')
  await pool.query(sql)
  console.log('Done!')

  const tpl = await pool.query('SELECT id, name, type, category FROM message_templates')
  console.log(`message_templates: ${tpl.rowCount} rows`)
  tpl.rows.forEach((r) => console.log(`  [${r.type}] ${r.name} (${r.category})`))

  const utm = await pool.query('SELECT COUNT(*)::text AS count FROM utm_links')
  console.log(`utm_links: ${utm.rows[0].count} rows`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
